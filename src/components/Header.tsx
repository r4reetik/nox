import { Button } from "./ui/button";

const Header = () => {
    return (
        <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left side - Nox branding */}
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold">
                        <span className="text-primary">nox</span>
                    </div>
                </div>

                {/* Right side - Connect wallet button */}
                <div className="flex items-center">
                    <Button size="sm" className="flex items-center gap-2">
                        {/* <Wallet className="h-4 w-4" /> */}
                        Connect Wallet
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
