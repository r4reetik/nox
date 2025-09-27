// src/indexer.rs
use crate::{
    config::Config,
    database::Database,
    models::{Position, PositionStatus, UnspentNote},
};
use anyhow::Result;
use ethers::prelude::*;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

abigen!(
    PrivacyProxy, "abi/PrivacyProxy.json";
    ClearingHouseV2, "abi/ClearingHouseV2.json";
    TokenPoolV2, "abi/TokenPool.json";
);

const BLOCK_CHUNK_SIZE: u64 = 2_000;
const DELAY_BETWEEN_CHUNKS_MS: u64 = 500; // 0.5 seconds
const POLLING_INTERVAL_SECONDS: u64 = 5;
const RESTART_DELAY_SECONDS: u64 = 10;

pub async fn run_indexer(
    config: Arc<Config>,
    db: Arc<Database>,
    provider: Arc<Provider<Ws>>,
) -> Result<()> {
    // Convert WebSocket provider to HTTP provider for polling
    let http_url = config
        .rpc_url
        .replace("wss://", "https://")
        .replace("ws://", "http://");
    let http_provider = Arc::new(Provider::<Http>::try_from(http_url)?);

    loop {
        if let Err(e) = indexer_logic(config.clone(), db.clone(), http_provider.clone()).await {
            eprintln!(
                "[Indexer] Error encountered: {}. Restarting in {} seconds...",
                e, RESTART_DELAY_SECONDS
            );
            sleep(Duration::from_secs(RESTART_DELAY_SECONDS)).await;
        }
    }
}

async fn indexer_logic(
    config: Arc<Config>,
    db: Arc<Database>,
    provider: Arc<Provider<Http>>,
) -> Result<()> {
    // Contract Instances
    let proxy_address: Address = config.privacy_proxy_address.parse()?;
    let proxy_contract = PrivacyProxy::new(proxy_address, Arc::clone(&provider));
    let ch_address = proxy_contract.clearing_house().call().await?;
    let ch_contract = ClearingHouseV2::new(ch_address, Arc::clone(&provider));
    let tp_address: Address = config.token_pool_address.parse()?;
    let token_pool_contract = TokenPoolV2::new(tp_address, Arc::clone(&provider));
    let token_address: Address = config.token_address.parse()?;

    println!("[Indexer] Starting HTTP-based indexer for all relevant contracts...");

    // Get starting block - you might want to store this in config or database
    let mut from_block = match provider.get_block_number().await {
        Ok(block_num) => {
            let current_block = block_num.as_u64();
            // Start from a few blocks back to ensure we don't miss anything
            if current_block > 100 {
                current_block - 100
            } else {
                0
            }
        }
        Err(e) => {
            eprintln!(
                "[FATAL INDEXER ERROR] Failed to get latest block number: {}",
                e
            );
            return Err(e.into());
        }
    };

    println!("[Indexer] Starting from block: {}", from_block);

    loop {
        let latest_block = match provider.get_block_number().await {
            Ok(block_num) => block_num.as_u64(),
            Err(e) => {
                eprintln!("[Indexer] Failed to get latest block: {}", e);
                sleep(Duration::from_secs(POLLING_INTERVAL_SECONDS)).await;
                continue;
            }
        };

        if from_block > latest_block {
            // We're caught up, wait before checking again
            sleep(Duration::from_secs(POLLING_INTERVAL_SECONDS)).await;
            continue;
        }

        let to_block = (from_block + BLOCK_CHUNK_SIZE - 1).min(latest_block);
        println!(
            "[Indexer] Querying logs from block {} to {}",
            from_block, to_block
        );

        // Create filters for the block range
        let pos_open_filter = proxy_contract
            .position_opened_filter()
            .from_block(from_block)
            .to_block(to_block);
        let pos_closed_filter = ch_contract
            .position_closed_filter()
            .from_block(from_block)
            .to_block(to_block);
        let pos_liquidated_filter = ch_contract
            .position_liquidated_filter()
            .from_block(from_block)
            .to_block(to_block);
        let note_created_filter = token_pool_contract
            .note_created_filter()
            .from_block(from_block)
            .to_block(to_block);
        let note_claimed_filter = token_pool_contract
            .note_claimed_filter()
            .from_block(from_block)
            .to_block(to_block);
        let public_pos_opened = ch_contract
            .position_opened_filter()
            .from_block(from_block)
            .to_block(to_block);

        // Query all events for this block range
        let query_results = tokio::try_join!(
            pos_open_filter.query(),
            pos_closed_filter.query(),
            pos_liquidated_filter.query(),
            note_created_filter.query(),
            note_claimed_filter.query(),
            public_pos_opened.query()
        );

        match query_results {
            Ok((
                pos_opened_logs,
                pos_closed_logs,
                pos_liquidated_logs,
                note_created_logs,
                note_claimed_logs,
                public_pos_opened_logs,
            )) => {
                // Process all events
                for log in pos_opened_logs {
                    if let Err(e) = handle_position_opened(&db, log) {
                        eprintln!("[Indexer] Error handling position opened: {}", e);
                    }
                }
                for log in pos_closed_logs {
                    if let Err(e) = handle_position_closed(&db, log) {
                        eprintln!("[Indexer] Error handling position closed: {}", e);
                    }
                }
                for log in pos_liquidated_logs {
                    if let Err(e) = handle_position_liquidated(&db, log) {
                        eprintln!("[Indexer] Error handling position liquidated: {}", e);
                    }
                }
                for log in note_created_logs {
                    if let Err(e) = handle_note_created(&db, log, token_address).await {
                        eprintln!("[Indexer] Error handling note created: {}", e);
                    }
                }
                for log in note_claimed_logs {
                    if let Err(e) = handle_note_claimed(&db, log) {
                        eprintln!("[Indexer] Error handling note claimed: {}", e);
                    }
                }
                for log in public_pos_opened_logs {
                    if let Err(e) = handle_public_pos_opened(&db, log, proxy_address) {
                        eprintln!("[Indexer] Error handling public position opened: {}", e);
                    }
                }

                // Successfully processed this chunk, move to next
                from_block = to_block + 1;
            }
            Err(e) => {
                eprintln!(
                    "[Indexer] Error querying events for blocks {} to {}: {}",
                    from_block, to_block, e
                );
                // Wait before retrying the same block range
                sleep(Duration::from_millis(DELAY_BETWEEN_CHUNKS_MS * 2)).await;
                continue;
            }
        }

        // Small delay between chunks to avoid overwhelming the RPC
        sleep(Duration::from_millis(DELAY_BETWEEN_CHUNKS_MS)).await;
    }
}

fn handle_public_pos_opened(
    db: &Database,
    log: clearing_house_v2::PositionOpenedFilter,
    proxy_address: Address,
) -> Result<()> {
    if log.user == proxy_address {
        return Ok(());
    }

    println!(
        "[Indexer] Public PositionOpened for user {}: ID 0x{}",
        log.user,
        hex::encode(log.position_id)
    );
    let position = Position {
        position_id: format!("0x{}", hex::encode(log.position_id)),
        is_long: log.is_long,
        entry_price: log.entry_price.to_string(),
        margin: log.margin.to_string(),
        size: log.size.to_string(),
    };
    let mut owner_id = [0u8; 32];
    owner_id[12..].copy_from_slice(log.user.as_bytes());

    db.add_open_position(&owner_id, position).map_err(|e| {
        eprintln!(
            "[Indexer ERROR] Failed to add public open position to DB: {}",
            e
        );
        e
    })?;

    Ok(())
}

/// Handles a PositionOpened event.
fn handle_position_opened(db: &Database, log: privacy_proxy::PositionOpenedFilter) -> Result<()> {
    println!(
        "[Indexer] PositionOpened: ID 0x{}",
        hex::encode(log.position_id)
    );
    let position = Position {
        position_id: format!("0x{}", hex::encode(log.position_id)),
        is_long: log.is_long,
        entry_price: log.entry_price.to_string(),
        margin: log.margin.to_string(),
        size: log.size.to_string(),
    };
    db.add_open_position(&log.owner_pub_key, position)
        .map_err(|e: anyhow::Error| {
            eprintln!("[Indexer ERROR] Failed to add open position to DB: {}", e);
            e
        })?;
    Ok(())
}

/// Handles a PositionClosed event.
fn handle_position_closed(
    db: &Database,
    log: clearing_house_v2::PositionClosedFilter,
) -> Result<()> {
    println!(
        "[Indexer] PositionClosed: ID 0x{}",
        hex::encode(log.position_id)
    );
    let pnl_str = log.pnl.to_string();
    db.move_to_historical(
        &log.position_id,
        PositionStatus::Closed,
        pnl_str,
        log.user.to_string(),
    )
    .map_err(|e| {
        eprintln!("[Indexer ERROR] Failed to move position (closed): {}", e);
        e
    })?;
    Ok(())
}

/// Handles a PositionLiquidated event.
fn handle_position_liquidated(
    db: &Database,
    log: clearing_house_v2::PositionLiquidatedFilter,
) -> Result<()> {
    println!(
        "[Indexer] PositionLiquidated: ID 0x{}",
        hex::encode(log.position_id)
    );
    let pnl_str = "Liquidated".to_string();
    db.move_to_historical(
        &log.position_id,
        PositionStatus::Liquidated,
        pnl_str,
        log.user.to_string(),
    )
    .map_err(|e| {
        eprintln!(
            "[Indexer ERROR] Failed to move position (liquidated): {}",
            e
        );
        e
    })?;
    Ok(())
}

/// Handles a NoteCreated event.
async fn handle_note_created(
    db: &Database,
    log: token_pool_v2::NoteCreatedFilter,
    token_address: Address,
) -> Result<()> {
    let mut nonce_bytes = [0u8; 32];
    let note_nonce = U256::from(log.note_nonce);
    note_nonce.to_big_endian(&mut nonce_bytes);
    let address_bytes = token_address.as_bytes();
    let mut encoded_data = Vec::new();
    encoded_data.extend_from_slice(address_bytes);
    encoded_data.extend_from_slice(&nonce_bytes);

    let note_id = ethers::utils::keccak256(&encoded_data);
    println!("[Indexer] NoteCreated: Note ID 0x{}", hex::encode(note_id));
    let unspent_note = UnspentNote {
        note_id: format!("0x{}", hex::encode(note_id)),
        note: crate::models::Note {
            note_nonce: log.note_nonce.as_u64(),
            receiver_hash: format!("0x{}", hex::encode(log.receiver_hash)),
            value: log.amount.to_string(),
        },
    };
    db.add_unspent_note(&unspent_note).map_err(|e| {
        eprintln!("[Indexer ERROR] Failed to add unspent note: {}", e);
        e
    })?;
    Ok(())
}

/// Handles a NoteClaimed event.
fn handle_note_claimed(db: &Database, log: token_pool_v2::NoteClaimedFilter) -> Result<()> {
    println!("[Indexer] NoteClaimed: ID 0x{}", hex::encode(log.note_id));
    db.remove_unspent_note(&log.note_id).map_err(|e| {
        eprintln!("[Indexer ERROR] Failed to remove unspent note: {}", e);
        e
    })?;
    Ok(())
}
