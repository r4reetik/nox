import { useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import oracleAbi from "@/abi/Oracle.json"; // Make sure path is correct

export const useOraclePrice = () => {
    return useReadContract({
        address: contracts.oracle.address,
        abi: oracleAbi.abi,
        functionName: "getPrice",
        query: {
            refetchInterval: 10000,
        },
    });
};
