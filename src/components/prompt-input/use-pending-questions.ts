import { useSyncExternalStore } from "react";

import {
  answerQuestions,
  getPendingQuestions,
  subscribePendingQuestions,
} from "@/lib/ai/question-bridge";
import type { QuestionAnswer } from "@/lib/ai/question-bridge";

export function usePendingQuestions() {
  const pendingQuestions = useSyncExternalStore(subscribePendingQuestions, getPendingQuestions);
  const isWaitingForAnswer = pendingQuestions !== null;

  function submitAnswers(answers: QuestionAnswer[]) {
    answerQuestions(answers);
  }

  return {
    pendingQuestions,
    isWaitingForAnswer,
    submitAnswers,
  };
}
