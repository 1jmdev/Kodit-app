import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { QuestionInput } from "@/lib/ai/question-bridge";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
    question: QuestionInput;
    onAnswer: (answers: string[]) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const isMultiple = question.multiple ?? false;

    function toggleOption(label: string) {
        if (!isMultiple) {
            onAnswer([label]);
            return;
        }

        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-4 py-2.5 border-b border-border/30">
                <div className="text-xs font-medium text-muted-foreground">
                    {question.header}
                </div>
                <div className="text-sm text-foreground mt-0.5">
                    {question.question}
                </div>
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
                                : "hover:bg-accent/50 text-foreground/80",
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isMultiple && (
                                <div
                                    className={cn(
                                        "size-4 rounded border flex items-center justify-center shrink-0",
                                        selected.has(opt.label)
                                            ? "bg-foreground border-foreground"
                                            : "border-border",
                                    )}
                                >
                                    {selected.has(opt.label) && (
                                        <svg
                                            className="size-3 text-background"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                        >
                                            <path
                                                d="M2 6L5 9L10 3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                            )}
                            <div>
                                <div className="font-medium">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {opt.description}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {isMultiple && selected.size > 0 && (
                <div className="px-4 pb-3">
                    <Button
                        size="sm"
                        onClick={() => onAnswer(Array.from(selected))}
                        className="w-full"
                    >
                        Submit ({selected.size} selected)
                    </Button>
                </div>
            )}
        </div>
    );
}
