import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { useAppStore } from "@/store/app-store";
import { Minus, Square, X, Maximize2 } from "lucide-react";

type Platform = "macos" | "windows" | "linux" | "unknown";

function usePlatform(): Platform {
  const [os, setOs] = useState<Platform>("unknown");

  useEffect(() => {
    try {
      const p = getPlatform();
      if (p === "macos" || p === "ios") {
        setOs("macos");
      } else if (p === "windows") {
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

function useWindowMaximized() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return isMaximized;
}

async function minimizeWindow() {
  const appWindow = getCurrentWindow();
  await appWindow.minimize();
}

async function toggleMaximize() {
  const appWindow = getCurrentWindow();
  await appWindow.toggleMaximize();
}

async function closeWindow() {
  const appWindow = getCurrentWindow();
  await appWindow.close();
}

function MacOSControls({ isMaximized }: { isMaximized: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={closeWindow}
        className="group size-3 rounded-full bg-[#ff5f57] transition-all hover:bg-[#ff5f57]/90 flex items-center justify-center"
        aria-label="Close"
      >
        {hovered && (
          <X className="size-2 text-[#460000] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
        )}
      </button>
      <button
        onClick={minimizeWindow}
        className="group size-3 rounded-full bg-[#febc2e] transition-all hover:bg-[#febc2e]/90 flex items-center justify-center"
        aria-label="Minimize"
      >
        {hovered && (
          <Minus className="size-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
        )}
      </button>
      <button
        onClick={toggleMaximize}
        className="group size-3 rounded-full bg-[#28c840] transition-all hover:bg-[#28c840]/90 flex items-center justify-center"
        aria-label={isMaximized ? "Restore" : "Maximize"}
      >
        {hovered && (
          <Maximize2 className="size-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

function WindowsLinuxControls({ isMaximized }: { isMaximized: boolean }) {
  return (
    <div className="flex items-center">
      <button
        onClick={minimizeWindow}
        className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground rounded-md"
        aria-label="Minimize"
      >
        <Minus className="size-4" />
      </button>
      <button
        onClick={toggleMaximize}
        className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground rounded-md"
        aria-label={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Square className="size-3" />
        ) : (
          <Square className="size-3.5" />
        )}
      </button>
      <button
        onClick={closeWindow}
        className="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-white rounded-md"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function WindowControls({ platform, isMaximized }: { platform: Platform; isMaximized: boolean }) {
  if (platform === "macos") {
    return <MacOSControls isMaximized={isMaximized} />;
  }

  return <WindowsLinuxControls isMaximized={isMaximized} />;
}

export function TitleBar() {
  const { state } = useAppStore();
  const platform = usePlatform();
  const isMaximized = useWindowMaximized();
  const { showWindowControls, windowControlsPosition } = state.settings.window;
  const controlsOnLeft = windowControlsPosition === "left";
  const pocketWidth = 160;
  const curveWidth = 62;
  const pocketTotalWidth = pocketWidth + curveWidth;

  return (
    <div className="relative z-30 h-[10px] flex-shrink-0">
      <div data-tauri-drag-region className="absolute inset-x-0 top-0 z-10 h-[10px] bg-sidebar" />

      {showWindowControls && controlsOnLeft && (
        <>
          <svg
            data-tauri-drag-region
            className="absolute left-0 top-0 z-20 h-11 scale-x-[-1]"
            style={{ width: `${pocketTotalWidth}px` }}
            viewBox="0 0 222 44"
            aria-hidden="true"
          >
            <path
              d="M0 10H24C38 10 50 15 60 22L72 33C80 41 90 44 106 44H222V10Z"
              fill="var(--sidebar)"
            />
          </svg>
          <div
            data-tauri-drag-region
            className="absolute left-0 top-0 z-30 flex h-11 items-start justify-center pt-1"
            style={{ width: `${pocketWidth}px` }}
          >
            <WindowControls platform={platform} isMaximized={isMaximized} />
          </div>
        </>
      )}

      {showWindowControls && !controlsOnLeft && (
        <>
          <svg
            data-tauri-drag-region
            className="absolute right-0 top-0 z-20 h-11"
            style={{ width: `${pocketTotalWidth}px` }}
            viewBox="0 0 222 44"
            aria-hidden="true"
          >
            <path
              d="M0 10H24C38 10 50 15 60 22L72 33C80 41 90 44 106 44H222V10Z"
              fill="var(--sidebar)"
            />
          </svg>
          <div
            data-tauri-drag-region
            className="absolute right-0 top-0 z-30 flex h-11 items-start justify-center pt-1"
            style={{ width: `${pocketWidth}px` }}
          >
            <WindowControls platform={platform} isMaximized={isMaximized} />
          </div>
        </>
      )}
    </div>
  );
}
