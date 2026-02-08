import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";

export type Platform = "macos" | "windows" | "linux" | "unknown";

export function usePlatform(): Platform {
    const [os, setOs] = useState<Platform>("unknown");

    useEffect(() => {
        try {
            const currentPlatform = getPlatform();
            if (currentPlatform === "macos" || currentPlatform === "ios") {
                setOs("macos");
            } else if (currentPlatform === "windows") {
                setOs("windows");
            } else {
                setOs("linux");
            }
        } catch {
            setOs("linux");
        }
    }, []);

    return os;
}

export function useWindowMaximized() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const appWindow = getCurrentWindow();
        appWindow
            .isMaximized()
            .then(setIsMaximized)
            .catch(() => setIsMaximized(false));

        const unlisten = appWindow.onResized(async () => {
            try {
                const maximized = await appWindow.isMaximized();
                setIsMaximized(maximized);
            } catch {
                setIsMaximized(false);
            }
        });

        return () => {
            unlisten.then((fn) => fn()).catch(() => {});
        };
    }, []);

    return isMaximized;
}
