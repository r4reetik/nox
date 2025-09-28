
import { CustomConnectButton } from "./CustomConnectButton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppStore, useAppActions, TradingMode } from "@/store/useAppStore";
import { useAccount, useSignMessage, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle } from "lucide-react";

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
        <header className="flex items-center justify-between p-6 border-b border-primary/20">
            <div className="flex items-center gap-4">
                <span className="h-1 text-3xl">Liquinox</span>
            </div>

            <div className="flex items-center gap-6">
                {!isConnected ? (
                    <CustomConnectButton />
                ) : isOnWrongNetwork ? (
                    <Button
                        variant="destructive"
                        onClick={() => switchChain({ chainId: AppChain.id })}
                        className="gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Switch to {AppChain.name}
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
        </header>
    );
};

export default Header;
