import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiffPanelHeader } from "@/components/app/diff-panel/DiffPanelHeader";
import { DiffFileBlock } from "@/components/app/diff-panel/DiffFileBlock";
import { DiffPanelFooter } from "@/components/app/diff-panel/DiffPanelFooter";
import { aggregateDiffSnapshots, buildThreadDiffStats } from "@/lib/diff-utils";
import {
  agentDeleteFile,
  agentWriteFile,
  clearDiffs,
  listDiffs,
} from "@/lib/tauri-storage";

export function DiffPanel() {
  const { state, dispatch } = useAppStore();
  const [reverting, setReverting] = useState(false);
  const activeThread = state.threads.find((thread) => thread.id === state.activeThreadId);
  const activeProject = state.projects.find((project) => project.id === activeThread?.projectId);

  const hasChanges = useMemo(() => (activeThread?.fileChanges.length ?? 0) > 0, [activeThread]);

  if (!activeThread || !activeProject) {
    return null;
  }

  const refreshThreadDiffState = async () => {
    const diffs = await listDiffs(activeThread.id);
    const stats = buildThreadDiffStats(diffs);
    dispatch({
      type: "SET_THREAD_DIFF_STATE",
      threadId: activeThread.id,
      fileChanges: stats.fileChanges,
      totalAdditions: stats.totalAdditions,
      totalDeletions: stats.totalDeletions,
      unstagedCount: stats.unstagedCount,
      stagedCount: stats.stagedCount,
    });
  };

  const handleRevertAll = async () => {
    if (reverting || !hasChanges) {
      return;
    }

    setReverting(true);
    try {
      const diffs = await listDiffs(activeThread.id);
      const snapshots = aggregateDiffSnapshots(diffs);
      for (const snapshot of snapshots) {
        if (snapshot.oldContent === null) {
          await agentDeleteFile({
            workspacePath: activeProject.workspacePath,
            path: snapshot.filePath,
            allowMissing: true,
          });
          continue;
        }

        await agentWriteFile({
          workspacePath: activeProject.workspacePath,
          path: snapshot.filePath,
          content: snapshot.oldContent,
          createDirs: true,
        });
      }

      await clearDiffs(activeThread.id);
      await refreshThreadDiffState();
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <DiffPanelHeader
        fileCount={activeThread.fileChanges.length}
        additions={activeThread.totalAdditions}
        deletions={activeThread.totalDeletions}
        unstagedCount={activeThread.unstagedCount}
        stagedCount={activeThread.stagedCount}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-1">
          {activeThread.fileChanges.map((file) => (
            <DiffFileBlock key={file.filePath} file={file} />
          ))}
        </div>
      </ScrollArea>

      <DiffPanelFooter canRevert={hasChanges} reverting={reverting} onRevertAll={handleRevertAll} />
    </div>
  );
}
