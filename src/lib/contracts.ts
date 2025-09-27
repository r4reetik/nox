import faucetAbi from "../abi/PublicFaucet.json";
import usdcAbi from "../abi/MockERC20.json";
import clearingHouseAbi from "../abi/ClearingHouse.json";
import oracleAbi from "../abi/Oracle.json";
import privacyProxyAbi from "../abi/PrivacyProxy.json";
import tokenPoolAbi from "../abi/TokenPool.json";
import {
    avalancheFuji,
    rootstockTestnet,
    citreaTestnet,
    scrollSepolia,
} from "viem/chains";

// opBNBTestnet
const USDC_ADDRESS = "0xdF5A95A3A9870353839d62f984e55c9F162f26bA" as const;
const ORACLE_ADDRESS = "0xEBa6bB8E72D43Bfa864bcE2B0F57Cfbd9C03009f" as const;
const CLEARING_HOUSE_ADDRESS =
    "0x870FaaA3adB1c5eAA85163da61c88AD488769E64" as const;
const FAUCET_ADDRESS = "0x82074e4bF613B46bEBbf268446E83149FEE7501A" as const;
const TOKEN_POOL_ADDRESS =
    "0xccD4de9FD552C3BF54bad1dc95a32ab136776E82" as const;
const PRIVACY_PROXY_ADDRESS =
    "0xbaE5e2b7362242Cf6C9806f158240fC4f4bB93cC" as const;

export const contracts = {
    faucet: {
        address: FAUCET_ADDRESS,
        abi: faucetAbi.abi,
    },
    usdc: {
        address: USDC_ADDRESS,
        abi: usdcAbi.abi,
    },
    clearingHouse: {
        address: CLEARING_HOUSE_ADDRESS,
        abi: clearingHouseAbi.abi,
    },
    oracle: {
        address: ORACLE_ADDRESS,
        abi: oracleAbi.abi,
    },
    privacyProxy: {
        address: PRIVACY_PROXY_ADDRESS,
        abi: privacyProxyAbi.abi,
    },
    tokenPool: {
        address: TOKEN_POOL_ADDRESS,
        abi: tokenPoolAbi.abi,
    },
} as const;

export const AppChain = citreaTestnet;
