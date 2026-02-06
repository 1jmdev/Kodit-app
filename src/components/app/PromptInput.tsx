import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { mockModels } from "@/store/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ChevronDown,
  Paperclip,
  Globe,
  AtSign,
} from "lucide-react";

interface PromptInputProps {
  variant?: "home" | "chat";
  placeholder?: string;
}

export function PromptInput({ variant = "chat", placeholder }: PromptInputProps) {
  const { state, dispatch } = useAppStore();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  function handleSubmit() {
    if (!input.trim()) return;

    if (!state.activeThreadId) {
      // Create new thread
      const threadId = `thread-${Date.now()}`;
      dispatch({
        type: "CREATE_THREAD",
        thread: {
          id: threadId,
          title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
          projectName: state.projects.find((p) => p.id === state.activeProjectId)?.name || "untitled",
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: "user",
              content: input,
              timestamp: Date.now(),
            },
          ],
          fileChanges: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          totalAdditions: 0,
          totalDeletions: 0,
          unstagedCount: 0,
          stagedCount: 0,
        },
      });
      setInput("");
      navigate(`/chat/${threadId}`);
    } else {
      dispatch({
        type: "ADD_MESSAGE",
        threadId: state.activeThreadId,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          content: input,
          timestamp: Date.now(),
        },
      });
      setInput("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isHome = variant === "home";

  return (
    <div className={cn(
      "w-full",
      isHome ? "max-w-2xl mx-auto" : ""
    )}>
      <div className={cn(
        "relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all",
        "focus-within:border-border focus-within:ring-1 focus-within:ring-ring/20",
        isHome ? "shadow-lg shadow-black/5" : "shadow-sm"
      )}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isHome ? "What do you want to build?" : "Ask for follow-up changes")}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm placeholder:text-muted-foreground/60 outline-none",
            isHome ? "min-h-[52px]" : "min-h-[40px]"
          )}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2.5 pb-2.5">
          {/* Left: tools */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground/70 hover:text-foreground" />
                }
              >
                <Paperclip className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground/70 hover:text-foreground" />
                }
              >
                <AtSign className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Mention</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground/70 hover:text-foreground" />
                }
              >
                <Globe className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Search web</TooltipContent>
            </Tooltip>

            {/* Model selector */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="ml-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                    <span className="font-medium">{state.selectedModel.name}</span>
                    <span className="text-muted-foreground/60">{state.selectedModel.qualityLevel}</span>
                    <ChevronDown className="size-3 text-muted-foreground/50" />
                  </button>
                }
              />
              <DropdownMenuContent align="start" side="top" sideOffset={8}>
                {mockModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => dispatch({ type: "SET_MODEL", model })}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.qualityLevel}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: submit */}
          <Button
            size="icon-sm"
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              "rounded-lg transition-all",
              input.trim()
                ? "bg-foreground text-background hover:bg-foreground/80"
                : "bg-muted text-muted-foreground"
            )}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
