import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { QuestionAnswer } from "@/lib/ai/question-bridge";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

import { PromptTools } from "./PromptTools";
import { QuestionCard } from "./QuestionCard";
import { submitPrompt } from "./submit-prompt";
import type { PromptInputProps } from "./types";
import { usePendingQuestions } from "./use-pending-questions";

export function PromptInput({ variant = "chat", placeholder, pendingProject, onPendingProjectSaved }: PromptInputProps) {
  const { state, dispatch } = useAppStore();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const modelProfiles = state.settings.modelProfiles.length > 0 ? state.settings.modelProfiles : [state.selectedModel];
  const { pendingQuestions, isWaitingForAnswer, submitAnswers } = usePendingQuestions();

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }, [input]);

  async function handleSubmit() {
    if (isWaitingForAnswer && pendingQuestions && input.trim()) {
      const answers: QuestionAnswer[] = pendingQuestions.map((q) => ({ question: q.question, answers: [input.trim()] }));
      submitAnswers(answers);
      setInput("");
      return;
    }

    await submitPrompt({
      input,
      isGenerating,
      state,
      dispatch,
      navigate,
      pendingProject,
      onPendingProjectSaved,
      setInput,
      setIsGenerating,
    });
  }

  const isHome = variant === "home";

  return (
    <div className={cn("w-full", isHome ? "max-w-2xl mx-auto" : "")}> 
      {isWaitingForAnswer && pendingQuestions && (
        <div className="mb-3 space-y-3">
          {pendingQuestions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              onAnswer={(answers) => {
                submitAnswers(
                  pendingQuestions.map((pending, pendingIndex) =>
                    pendingIndex === index ? { question: pending.question, answers } : { question: pending.question, answers: [] },
                  ),
                );
              }}
            />
          ))}
        </div>
      )}

      <div className={cn("relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all", "focus-within:border-border focus-within:ring-1 focus-within:ring-ring/20", isHome ? "shadow-lg shadow-black/5" : "shadow-sm")}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={isWaitingForAnswer ? "Type your own answer..." : placeholder || (isHome ? "What do you want to build?" : "Ask for follow-up changes")}
          rows={1}
          className={cn("w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm placeholder:text-muted-foreground/60 outline-none", isHome ? "min-h-[52px]" : "min-h-[40px]")}
        />

        <div className="flex items-center justify-between px-2.5 pb-2.5">
          <PromptTools selectedModel={state.selectedModel} modelProfiles={modelProfiles} dispatch={dispatch} />
          <Button
            size="icon-sm"
            onClick={() => void handleSubmit()}
            disabled={(!input.trim() && !isWaitingForAnswer) || (isGenerating && !isWaitingForAnswer)}
            className={cn("rounded-lg transition-all", input.trim() ? "bg-foreground text-background hover:bg-foreground/80" : "bg-muted text-muted-foreground")}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
