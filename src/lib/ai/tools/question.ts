import { tool } from "ai";
import { z } from "zod";
import { askUser } from "@/lib/ai/question-bridge";
import type { QuestionInput } from "@/lib/ai/question-bridge";
import DESCRIPTION from "./question.txt";

export type { QuestionInput, QuestionAnswer } from "@/lib/ai/question-bridge";

const questionOptionSchema = z.object({
  label: z.string().describe("Display text (1-5 words, concise)"),
  description: z.string().describe("Explanation of choice"),
});

const questionSchema = z.object({
  question: z.string().describe("Complete question"),
  header: z.string().describe("Very short label (max 30 chars)"),
  options: z.array(questionOptionSchema).describe("Available choices"),
  multiple: z.boolean().optional().describe("Allow selecting multiple choices"),
  custom: z.boolean().optional().describe("Allow typing a custom answer (default: true)"),
});

export function createQuestionTool() {
  return tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      questions: z.array(questionSchema).describe("Questions to ask"),
    }),
    execute: async ({ questions }) => {
      // This blocks until the user answers in the UI
      const answers = await askUser(questions as QuestionInput[]);
      return { answers };
    },
  });
}
