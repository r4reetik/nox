import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-gas-reporter";
import "solidity-coverage";
import "@typechain/hardhat";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-verify";

if (!process.env.OPTIMISM_ETHERSCAN_API_KEY) {
    console.error("No API key configured");
}

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const config: HardhatUserConfig = {
    sourcify: {
        enabled: false,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.28",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    // viaIR: true,
                },
            },
        ],
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },

        citrea: {
            url: "https://rpc.testnet.citrea.xyz",
            accounts: [deployerPrivateKey],
            chainId: 5115,
        },
        hardhat: {
            allowUnlimitedContractSize: true,
            gasPrice: "auto",
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
        outputFile: process.env.CI ? "gas-report.txt" : undefined,
        noColors: !!process.env.CI,
    },
    typechain: {
        outDir: "typechain-types",
        alwaysGenerateOverloads: false,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache_hardhat",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 40000,
    },
    etherscan: {
        apiKey: {
            citrea: "some",
        },
        customChains: [
            {
                network: "citrea",
                chainId: 5115,
                urls: {
                    apiURL: "https://explorer.testnet.citrea.xyz/api",
                    browserURL: "https://explorer.testnet.citrea.xyz",
                },
            },
        ],
    },
};

export default config;
