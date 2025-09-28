export interface UserCommitmentInfo {
    value: string;
    leaf_index: number;
}

export interface UserMetadata {
    last_used_nullifier_nonce: number;
    commitment_info: UserCommitmentInfo | null;
}

export interface ApiPosition {
    position_id: string;
    is_long: boolean;
    entry_price: string;
    margin: string;
    size: string;
}

export interface HistoricalPosition {
    position_id: string;
    is_long: boolean;
    entry_price: string;
    margin: string;
    size: string;
    status: "Closed" | "Liquidated";
    final_pnl: string;
}

export interface ApiNote {
    note_id: string;
    note_nonce: number;
    value: string;
    receiver_hash: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    has_more: boolean;
    next_cursor: string | null;
}

export type AppState =
    | "IDLE"
    | "LOADING"
    | "FOUND_OPEN"
    | "FOUND_HISTORICAL"
    | "NOT_FOUND";

export interface BasePositionData {
    position_id: string;
    is_long: boolean;
    size: string;
    margin: string;
    entry_price: string;
}
export interface OpenPosition extends BasePositionData {
    pnl: string;
    liquidation_price: string;
}

export interface HistoricalPositionData extends BasePositionData {
    status: "Closed" | "Liquidated";
    final_pnl: string;
    owner_address: string; // The owner at the time it was closed
}

export type Position =
    | { status: "Open"; data: BasePositionData }
    | { status: "Historical"; data: HistoricalPositionData };

export interface PositionApiResponse {
    position:
        | { status: "Open"; data: BasePositionData }
        | { status: "Historical"; data: HistoricalPositionData };
}
