import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { ChatView } from "@/components/chat/ChatView";
import { DiffPanel } from "@/components/diff/DiffPanel";
import { TopBar } from "@/components/chat/TopBar";
import { ThreadTodoBar } from "@/components/chat/ThreadTodoBar";
import { PromptInput } from "@/components/prompt-input/PromptInput";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { state, dispatch } = useAppStore();

  useEffect(() => {
    if (threadId) {
      dispatch({ type: "SET_ACTIVE_THREAD", threadId });
    }
  }, [threadId, dispatch]);

  const activeThread =
    (threadId ? state.threads.find((t) => t.id === threadId) : undefined) ??
    (state.activeThreadId ? state.threads.find((t) => t.id === state.activeThreadId) : undefined);
  const hasDiffContent = activeThread && activeThread.fileChanges.length > 0;
  const showDiff = state.diffPanelOpen && hasDiffContent;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar />
      <ThreadTodoBar />
      <div className="flex-1 overflow-hidden">
        {showDiff ? (
          <ResizablePanelGroup direction="horizontal">
            {/* Chat panel */}
            <ResizablePanel defaultSize={55} minSize={35}>
              <div className="flex h-full flex-col">
                <ChatView />
                <div className="border-t border-border/30 px-6 py-3">
                  <PromptInput variant="chat" />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Diff panel */}
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="h-full min-h-0">
                <DiffPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex h-full flex-col">
            <ChatView />
            <div className="border-t border-border/30 px-6 py-3">
              <PromptInput variant="chat" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
