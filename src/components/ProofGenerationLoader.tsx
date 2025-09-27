import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
    "Initializing Barretenberg backend...",
    "Loading circuit constraints...",
    "Fetching user's Merkle proof...",
    "Generating witness values...",
    "Executing ACVM...",
    "Synthesizing ZK-SNARK proof...",
    "Finalizing public inputs...",
    "Proof generation complete!",
];

export const ProofGenerationLoader = ({ isActive }: { isActive: boolean }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            setCurrentStep(0); // Reset on activation
            interval = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev >= STEPS.length - 2) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 750);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    useEffect(() => {
        if (!isActive && currentStep > 0) {
            setCurrentStep(STEPS.length - 1);
        }
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="glass-panel p-8 rounded-lg neon-border-primary w-full max-w-md text-center space-y-6">
                <h2 className="text-2xl font-bold text-glow">
                    Generating Secure Proof
                </h2>
                <p className="text-muted-foreground">
                    Your browser is securely performing advanced cryptographic
                    calculations. Please keep this window open to protect your
                    privacy.
                </p>
                <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary animate-progress-bar"
                        style={{ animationDuration: "5s" }}
                    ></div>
                </div>
                <div className="h-8 flex items-center justify-center font-mono text-primary">
                    <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                    <span className="animate-fade-in-out">
                        {STEPS[currentStep]}
                    </span>
                </div>
            </div>
        </div>
    );
};
