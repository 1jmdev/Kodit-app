import { useState } from "react";
import { Maximize2, Minus, Square, X } from "lucide-react";

import type { Platform } from "@/components/titlebar/use-window-state";
import { closeWindow, minimizeWindow, toggleMaximizeWindow } from "@/components/titlebar/window-actions";

interface WindowControlsProps {
  platform: Platform;
  isMaximized: boolean;
}

function MacOSControls({ isMaximized }: { isMaximized: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center gap-2" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={() => void closeWindow()} className="group size-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/90 flex items-center justify-center" aria-label="Close">
        {hovered && <X className="size-2 text-[#460000] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />}
      </button>
      <button onClick={() => void minimizeWindow()} className="group size-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/90 flex items-center justify-center" aria-label="Minimize">
        {hovered && <Minus className="size-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />}
      </button>
      <button onClick={() => void toggleMaximizeWindow()} className="group size-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/90 flex items-center justify-center" aria-label={isMaximized ? "Restore" : "Maximize"}>
        {hovered && <Maximize2 className="size-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />}
      </button>
    </div>
  );
}

function WindowsLinuxControls({ isMaximized }: { isMaximized: boolean }) {
  return (
    <div className="flex items-center">
      <button onClick={() => void minimizeWindow()} className="flex h-8 w-10 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground rounded-md" aria-label="Minimize">
        <Minus className="size-4" />
      </button>
      <button onClick={() => void toggleMaximizeWindow()} className="flex h-8 w-10 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground rounded-md" aria-label={isMaximized ? "Restore" : "Maximize"}>
        <Square className={isMaximized ? "size-3" : "size-3.5"} />
      </button>
      <button onClick={() => void closeWindow()} className="flex h-8 w-10 items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white rounded-md" aria-label="Close">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function WindowControls({ platform, isMaximized }: WindowControlsProps) {
  if (platform === "macos") {
    return <MacOSControls isMaximized={isMaximized} />;
  }
  return <WindowsLinuxControls isMaximized={isMaximized} />;
}
