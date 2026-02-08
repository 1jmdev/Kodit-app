import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffPanelFooterProps {
  canRevert: boolean;
  reverting: boolean;
  onRevertAll: () => void;
}

export function DiffPanelFooter({ canRevert, reverting, onRevertAll }: DiffPanelFooterProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/30 px-4 py-2">
      <Button
        variant="outline"
        size="xs"
        className="gap-1 text-xs"
        disabled={!canRevert || reverting}
        onClick={onRevertAll}
      >
        <RotateCcw className="size-3" />
        {reverting ? "Reverting..." : "Revert all"}
      </Button>
    </div>
  );
}
