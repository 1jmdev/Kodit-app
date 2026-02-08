/**
 * Shared types for the question tool.
 * Defined here to avoid circular imports between question.ts and the bridge.
 */
export interface QuestionOption {
  label: string;
  description: string;
}

export interface QuestionInput {
  question: string;
  header: string;
  options: QuestionOption[];
  multiple?: boolean;
  custom?: boolean;
}

export interface QuestionAnswer {
  question: string;
  answers: string[];
}

type ResolveAnswersFn = (answers: QuestionAnswer[]) => void;

interface PendingQuestionState {
  questions: QuestionInput[];
  resolve: ResolveAnswersFn;
}

let pendingState: PendingQuestionState | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

/**
 * Called by the question tool's execute().
 * Stores the questions and returns a promise that resolves when the user answers.
 */
export function askUser(questions: QuestionInput[]): Promise<QuestionAnswer[]> {
  return new Promise<QuestionAnswer[]>((resolve) => {
    pendingState = { questions, resolve };
    notify();
  });
}

/**
 * Called by the UI when the user picks answers.
 */
export function answerQuestions(answers: QuestionAnswer[]): void {
  if (pendingState) {
    const { resolve } = pendingState;
    pendingState = null;
    notify();
    resolve(answers);
  }
}

/**
 * Returns the currently pending questions, or null.
 */
export function getPendingQuestions(): QuestionInput[] | null {
  return pendingState?.questions ?? null;
}

/**
 * Subscribe to changes in the pending question state.
 */
export function subscribePendingQuestions(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Clear any pending question (e.g. when stream ends or errors).
 */
export function clearPendingQuestions(): void {
  if (pendingState) {
    // Resolve with empty answers so the tool doesn't hang forever
    pendingState.resolve([]);
    pendingState = null;
    notify();
  }
}
