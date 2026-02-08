import { useAppStore } from "@/store/app-store";
import { WindowControls } from "@/components/titlebar/WindowControls";
import { usePlatform, useWindowMaximized } from "@/components/titlebar/use-window-state";

export function TitleBar() {
  const { state } = useAppStore();
  const platform = usePlatform();
  const isMaximized = useWindowMaximized();
  const { showWindowControls } = state.settings.window;

  return (
    <div className="relative z-30 h-[10px] flex-shrink-0">
      <div data-tauri-drag-region className="absolute inset-x-0 top-0 z-10 h-[10px] bg-sidebar" />

      {showWindowControls && (
        <>
          <svg data-tauri-drag-region className="absolute right-0 top-0 z-20 h-11" viewBox="0 0 222 44" aria-hidden="true">
            <path d="M0 10H24C38 10 50 15 60 22L72 33C80 41 90 44 106 44H222V10Z" fill="var(--sidebar)" />
          </svg>
          <div data-tauri-drag-region className="absolute right-4 top-0 z-30 flex h-11 items-start justify-center pt-1">
            <WindowControls platform={platform} isMaximized={isMaximized} />
          </div>
        </>
      )}
    </div>
  );
}
