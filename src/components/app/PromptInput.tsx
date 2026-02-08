import { useState, useRef, useEffect, useSyncExternalStore } from "react";
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
import { getProviderApiKeyHint, streamProviderText, validateProviderApiKey } from "@/lib/ai";
import { getProviderPreset } from "@/lib/ai/providers";
import { addMessage, createProject, createThread } from "@/lib/tauri-storage";
import {
  getPendingQuestions,
  subscribePendingQuestions,
  answerQuestions,
  clearPendingQuestions,
} from "@/lib/ai/question-bridge";
import type { QuestionInput, QuestionAnswer } from "@/lib/ai/question-bridge";
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
  pendingProject?: {
    name: string;
    workspacePath: string;
  } | null;
  onPendingProjectSaved?: () => void;
}

export function PromptInput({ variant = "chat", placeholder, pendingProject, onPendingProjectSaved }: PromptInputProps) {
  const { state, dispatch } = useAppStore();
  const modelProfiles = state.settings.modelProfiles.length > 0
    ? state.settings.modelProfiles
    : [state.selectedModel];
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Subscribe to the global question bridge
  const pendingQuestions = useSyncExternalStore(
    subscribePendingQuestions,
    getPendingQuestions,
  );
  const isWaitingForAnswer = pendingQuestions !== null;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  function handleAnswerQuestions(answers: QuestionAnswer[]) {
    answerQuestions(answers);
  }

  async function handleSubmit() {
    // If there's a pending question, treat the input as a custom answer
    if (isWaitingForAnswer && pendingQuestions && input.trim()) {
      const answers: QuestionAnswer[] = pendingQuestions.map((q) => ({
        question: q.question,
        answers: [input.trim()],
      }));
      handleAnswerQuestions(answers);
      setInput("");
      return;
    }

    if (!input.trim()) return;
    if (isGenerating) return;

    const userInput = input.trim();
    let activeProjectId = state.activeProjectId;
    let activeWorkspacePath = state.projects.find((project) => project.id === activeProjectId)?.workspacePath ?? null;
    if (!activeProjectId && !pendingProject) {
      return;
    }

    const currentThread = state.threads.find((thread) => thread.id === state.activeThreadId);
    const previousMessages = currentThread?.messages ?? [];
    setInput("");

    let threadId = state.activeThreadId;
    if (!threadId) {
      if (pendingProject) {
        const project = await createProject({
          name: pendingProject.name,
          workspacePath: pendingProject.workspacePath,
        });
        dispatch({ type: "SET_PROJECTS", projects: [project, ...state.projects.filter((p) => p.id !== project.id)] });
        dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id });
        activeProjectId = project.id;
        activeWorkspacePath = project.workspacePath;
        onPendingProjectSaved?.();
      }

      if (!activeProjectId) {
        return;
      }

      const createdThread = await createThread({
        projectId: activeProjectId,
        title: userInput.slice(0, 50) + (userInput.length > 50 ? "..." : ""),
      });
      dispatch({ type: "UPSERT_THREAD", thread: createdThread });
      dispatch({ type: "SET_ACTIVE_THREAD", threadId: createdThread.id });
      threadId = createdThread.id;
      navigate(`/chat/${threadId}`);
    }
    if (!threadId) return;

    if (!activeWorkspacePath) {
      const savedAgentMessage = await addMessage({
        threadId,
        role: "agent",
        content: "Missing active workspace path. Create or select a project with a valid workspace.",
        mode: "build",
        model: state.selectedModel.id,
        provider: state.selectedModel.provider,
      });

      dispatch({
        type: "ADD_MESSAGE",
        threadId,
        message: savedAgentMessage,
      });
      return;
    }

    const userMessage = await addMessage({
      threadId,
      role: "user",
      content: userInput,
      mode: "build",
    });

    dispatch({
      type: "ADD_MESSAGE",
      threadId,
      message: userMessage,
    });

    const assistantMessageId = `temp-agent-${Date.now()}`;
    dispatch({
      type: "ADD_MESSAGE",
      threadId,
      message: {
        id: assistantMessageId,
        role: "agent",
        content: "",
        reasoning: "",
        timestamp: Date.now(),
        isStreaming: true,
        model: state.selectedModel.id,
        provider: state.selectedModel.provider,
        mode: "build",
      },
    });

    const threadMessages = [...previousMessages, userMessage];

    const providerId = state.selectedModel.providerId;
    const providerLabel = getProviderPreset(providerId).label;
    const providerApiKey = state.settings.apiKeys[providerId] ?? "";
    const keyValidation = validateProviderApiKey(providerId, providerApiKey);
    if (!keyValidation.success) {
      const savedAgentMessage = await addMessage({
        threadId,
        role: "agent",
        content: `Missing ${providerLabel} key. Open Settings and add your key.\n\n${getProviderApiKeyHint(providerId)}`,
        mode: "build",
        model: state.selectedModel.id,
        provider: state.selectedModel.provider,
        parentId: userMessage.id,
      });

      dispatch({
        type: "REPLACE_MESSAGE",
        threadId,
        messageId: assistantMessageId,
        nextMessage: savedAgentMessage,
      });
      return;
    }

    setIsGenerating(true);
    try {
      const streamResult = await streamProviderText({
        providerId,
        apiKey: providerApiKey,
        modelId: state.selectedModel.id,
        messages: threadMessages,
        workspacePath: activeWorkspacePath,
        initialTodos: currentThread?.todos ?? [],
        onChunk: (chunk) => {
          dispatch({
            type: "UPDATE_MESSAGE",
            threadId: threadId!,
            messageId: assistantMessageId,
            content: chunk,
            isStreaming: true,
          });
        },
        onReasoning: (reasoning) => {
          dispatch({
            type: "UPDATE_MESSAGE",
            threadId: threadId!,
            messageId: assistantMessageId,
            reasoning,
            isStreaming: true,
          });
        },
        onToolCalls: (toolCalls) => {
          dispatch({
            type: "UPDATE_MESSAGE",
            threadId: threadId!,
            messageId: assistantMessageId,
            toolCalls,
            isStreaming: true,
          });
        },
        onTodos: (todos) => {
          dispatch({
            type: "SET_THREAD_TODOS",
            threadId: threadId!,
            todos,
          });
        },
      });

      const savedAgentMessage = await addMessage({
        threadId,
        role: "agent",
        content: streamResult.text || "No response received from model.",
        reasoning: streamResult.reasoning,
        toolCalls: streamResult.toolCalls,
        todos: streamResult.todos,
        mode: "build",
        model: state.selectedModel.id,
        provider: state.selectedModel.provider,
        parentId: userMessage.id,
      });

      dispatch({
        type: "SET_THREAD_TODOS",
        threadId,
        todos: streamResult.todos,
      });

      dispatch({
        type: "REPLACE_MESSAGE",
        threadId,
        messageId: assistantMessageId,
        nextMessage: savedAgentMessage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to stream response.";
      const savedAgentMessage = await addMessage({
        threadId,
        role: "agent",
        content: `Error: ${message}`,
        mode: "build",
        model: state.selectedModel.id,
        provider: state.selectedModel.provider,
        parentId: userMessage.id,
      });

      dispatch({
        type: "REPLACE_MESSAGE",
        threadId,
        messageId: assistantMessageId,
        nextMessage: savedAgentMessage,
      });
    } finally {
      setIsGenerating(false);
      clearPendingQuestions();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  const isHome = variant === "home";

  return (
    <div className={cn(
      "w-full",
      isHome ? "max-w-2xl mx-auto" : ""
    )}>
      {/* Question cards */}
      {isWaitingForAnswer && pendingQuestions && (
        <div className="mb-3 space-y-3">
          {pendingQuestions.map((q, qi) => (
            <QuestionCard
              key={qi}
              question={q}
              onAnswer={(answers) => {
                handleAnswerQuestions(
                  pendingQuestions.map((pq, pqi) =>
                    pqi === qi
                      ? { question: pq.question, answers }
                      : { question: pq.question, answers: [] }
                  ),
                );
              }}
            />
          ))}
        </div>
      )}

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
          placeholder={
            isWaitingForAnswer
              ? "Type your own answer..."
              : placeholder || (isHome ? "What do you want to build?" : "Ask for follow-up changes")
          }
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
                    <ChevronDown className="size-3 text-muted-foreground/50" />
                  </button>
                }
              />
              <DropdownMenuContent align="start" side="top" sideOffset={8} className="max-h-72 w-80 overflow-y-auto">
                {modelProfiles.map((model) => (
                  <DropdownMenuItem
                    key={`${model.providerId}:${model.id}`}
                    onClick={() => dispatch({ type: "SET_MODEL", model })}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium truncate">{model.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{model.provider}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: submit */}
            <Button
              size="icon-sm"
              onClick={() => void handleSubmit()}
              disabled={(!input.trim() && !isWaitingForAnswer) || (isGenerating && !isWaitingForAnswer)}
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

/**
 * Interactive question card rendered when the agent asks the user a question.
 */
function QuestionCard({
  question,
  onAnswer,
}: {
  question: QuestionInput;
  onAnswer: (answers: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isMultiple = question.multiple ?? false;

  function toggleOption(label: string) {
    if (isMultiple) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    } else {
      // Single select: pick and submit immediately
      onAnswer([label]);
    }
  }

  function handleSubmitMultiple() {
    if (selected.size > 0) {
      onAnswer(Array.from(selected));
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-4 py-2.5 border-b border-border/30">
        <div className="text-xs font-medium text-muted-foreground">{question.header}</div>
        <div className="text-sm text-foreground mt-0.5">{question.question}</div>
      </div>
      <div className="p-2 space-y-1">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => toggleOption(opt.label)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              selected.has(opt.label)
                ? "bg-accent text-foreground"
                : "hover:bg-accent/50 text-foreground/80"
            )}
          >
            <div className="flex items-center gap-2">
              {isMultiple && (
                <div className={cn(
                  "size-4 rounded border flex items-center justify-center shrink-0",
                  selected.has(opt.label)
                    ? "bg-foreground border-foreground"
                    : "border-border"
                )}>
                  {selected.has(opt.label) && (
                    <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              )}
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {isMultiple && selected.size > 0 && (
        <div className="px-4 pb-3">
          <Button
            size="sm"
            onClick={handleSubmitMultiple}
            className="w-full"
          >
            Submit ({selected.size} selected)
          </Button>
        </div>
      )}
    </div>
  );
}
