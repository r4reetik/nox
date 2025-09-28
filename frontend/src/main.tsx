import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppChain } from "./lib/contracts.ts";

export const config = getDefaultConfig({
    appName: "Dark Perps",
    projectId: "a51c54dcf4240568bf0f1c1eea6822b1",
    chains: [AppChain],
    ssr: false,
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
                <App />
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
);
