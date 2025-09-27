import { Button } from "./ui/button";
import { Wallet } from "lucide-react";

const Header = () => {
    return (
        <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold">
                        <span className="text-primary">NOX</span>
                    </div>
                </div>

                <div className="flex items-center">
                    <Button size="sm" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
