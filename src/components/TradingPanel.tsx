import { useAppStore } from "@/store/useAppStore";
import { Button } from "./ui/button";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { useCallback, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { contracts } from "@/lib/contracts";
import { RefreshCw } from "lucide-react";

const TradingPanel = () => {
    const [margin, setMargin] = useState<string>("100");
    const [modalType, setModalType] = useState<"deposit" | "withdraw">(
        "deposit"
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { address, isConnected } = useAccount();
    const { tradingMode, userClient, refetchSignal } = useAppStore();
    const isPrivateMode = tradingMode === "Private" && !!userClient;

    const {
        data: publicFreeCollateral,
        refetch: refetchPublicCollateral,
        isFetching: isPublicCollateralFetching,
    } = useReadContract({
        ...contracts.clearingHouse,
        functionName: "freeCollateral",
        args: [address!],
        query: { enabled: isConnected && !isPrivateMode },
    });

    const {
        data: eoaUsdcBalance,
        refetch: refetchEoaBalance,
        isFetching: isEoaBalanceFetching,
    } = useBalance({ address, token: contracts.usdc.address });

    const {
        data: privateFreeCollateral,
        refetch: refetchPrivateCollateral,
        isFetching: isPrivateCollateralFetching,
    } = useReadContract({
        ...contracts.privacyProxy,
        functionName: "userFreeCollateral",
        args: [userClient?.pubKey!],
        query: { enabled: isConnected && isPrivateMode },
    });

    const handleRefetchAll = useCallback(() => {
        refetchEoaBalance();
        if (tradingMode === "Private" && userClient) {
            refetchPrivateCollateral();
            userClient.fetchAndSetMetadata();
        } else {
            refetchPublicCollateral();
        }
    }, [
        tradingMode,
        userClient,
        refetchEoaBalance,
        refetchPrivateCollateral,
        refetchPublicCollateral,
    ]);

    const isRefetching =
        isEoaBalanceFetching ||
        isPrivateCollateralFetching ||
        isPublicCollateralFetching;

    const formatCurrency = (value: bigint) => {
        const formatted = formatUnits(value, 18);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(parseFloat(formatted));
    };

    const privateUsdcBalance = userClient?.currentMetadata?.commitment_info
        ? BigInt(userClient.currentMetadata.commitment_info.value)
        : 0n;

    const walletBalance = isPrivateMode
        ? privateUsdcBalance
        : (eoaUsdcBalance?.value ?? 0n);

    const freeCollateral = isPrivateMode
        ? privateFreeCollateral
        : publicFreeCollateral;

    const formattedWalletBalance = formatCurrency(walletBalance);

    const marginAsBigInt = useMemo(
        () => (margin ? parseUnits(margin, 18) : 0n),
        [margin]
    );

    const canAffordMargin = freeCollateral
        ? (freeCollateral as bigint) >= marginAsBigInt
        : false;

    const formattedFreeCollateral = formatCurrency(
        (freeCollateral as bigint) ?? 0n
    );

    const handleOpenModal = (type: "deposit" | "withdraw") => {
        setModalType(type);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                            {tradingMode} Account
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefetchAll}
                            disabled={isRefetching}
                            className="text-muted-foreground hover:text-primary"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                {isPrivateMode
                                    ? "Private Balance:"
                                    : "Wallet (USDC):"}
                            </span>
                            <span className="font-mono text-lg">
                                {formattedWalletBalance}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Free Collateral:
                            </span>
                            <span className="font-mono text-lg text-success">
                                {formattedFreeCollateral}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => handleOpenModal("deposit")}
                            disabled={!isConnected}
                        >
                            Deposit
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleOpenModal("withdraw")}
                            disabled={!isConnected}
                        >
                            Withdraw
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TradingPanel;
