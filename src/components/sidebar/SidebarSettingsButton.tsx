import type { MouseEvent } from "react";
import { Settings } from "lucide-react";

interface SidebarSettingsButtonProps {
  onOpenSettings: () => void;
  onPrimaryMouseDown: (event: MouseEvent<HTMLButtonElement>, action: () => void) => void;
  onKeyboardClick: (event: MouseEvent<HTMLButtonElement>, action: () => void) => void;
}

export function SidebarSettingsButton({
  onOpenSettings,
  onPrimaryMouseDown,
  onKeyboardClick,
}: SidebarSettingsButtonProps) {
  return (
    <div className="px-2 pb-3 pt-1">
      <button
        onMouseDown={(event) => onPrimaryMouseDown(event, onOpenSettings)}
        onClick={(event) => onKeyboardClick(event, onOpenSettings)}
        className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
      >
        <Settings className="size-3.5" />
        <span className="font-medium">Settings</span>
      </button>
    </div>
  );
}
