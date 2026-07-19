import { z } from "zod";

export const testQuestionSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(1),
  type: z.enum(["multiple_choice", "short_answer"]),
  options: z.array(z.string().trim().min(1)).min(2).nullable(),
  correct_answer: z.string().trim().min(1),
}).strict().refine(
  (question) => question.type === "multiple_choice" ? Array.isArray(question.options) : question.options === null,
  {
    message: "Multiple choice questions require options; short answer questions must use null options.",
    path: ["options"],
  },
);

export const generatedTestSchema = z.object({
  questions: z.array(testQuestionSchema).min(5).max(8),
}).strict();

export type TestQuestion = z.infer<typeof testQuestionSchema>;
export type GeneratedTest = z.infer<typeof generatedTestSchema>;
