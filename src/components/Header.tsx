import { Button } from "./ui/button";
import { AlertTriangle, Wallet } from "lucide-react";
import { CustomConnectButton } from "./CustomConnectButton";
import type { TradingMode } from "@/store/useAppStore";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore, useAppActions } from "@/store/useAppStore";
import { useAccount, useSignMessage, useChainId, useSwitchChain } from "wagmi";
import { AppChain } from "@/lib/contracts";

const Header = () => {
    const { tradingMode, isLoadingClient } = useAppStore();
    const { initializeUserClient, setTradingMode } = useAppActions();

    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const isOnWrongNetwork = isConnected && chainId !== AppChain.id;

    const handleModeChange = (isPrivate: boolean) => {
        const newMode: TradingMode = isPrivate ? "Private" : "Public";
        if (newMode === "Private" && isConnected && address) {
            initializeUserClient(address, signMessageAsync);
        } else {
            setTradingMode(newMode);
        }
    };

    return (
        <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold">
                        <span className="text-primary">NOX</span>
                    </div>
                </div>

                <div className="flex items-center">
                    {!isConnected ? (
                        <CustomConnectButton />
                    ) : isOnWrongNetwork ? (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                switchChain({ chainId: AppChain.id });
                            }}
                            className="gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Switch to OP BNB
                        </Button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Label
                                    htmlFor="trading-mode"
                                    className="text-muted-foreground"
                                >
                                    Public
                                </Label>
                                <Switch
                                    id="trading-mode"
                                    checked={tradingMode === "Private"}
                                    onCheckedChange={handleModeChange}
                                    disabled={isLoadingClient}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <Label
                                    htmlFor="trading-mode"
                                    className="text-primary font-bold"
                                >
                                    Private
                                </Label>
                            </div>
                            <CustomConnectButton />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
