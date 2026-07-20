import { z } from "zod";

export const progressStatusSchema = z.enum(["completed", "in_progress", "not_started"]);

export type ProgressStatus = z.infer<typeof progressStatusSchema>;

export type PhaseProgress = {
  phaseNumber: number;
  title: string;
  status: ProgressStatus;
};

const phaseSchema = z.object({
  title: z.string().trim().min(1).catch("Untitled milestone"),
});

export const phasesSchema = z.array(phaseSchema).catch([]);

export function calculateOverallProgress(phases: PhaseProgress[]) {
  if (phases.length === 0) {
    return 0;
  }

  const completedCount = phases.filter((phase) => phase.status === "completed").length;

  return Math.round((completedCount / phases.length) * 100);
}

export function getCurrentPhaseNumber(phases: PhaseProgress[]) {
  if (phases.length === 0) {
    return 0;
  }

  const inProgressPhase = phases.find((phase) => phase.status === "in_progress");

  if (inProgressPhase) {
    return inProgressPhase.phaseNumber;
  }

  const firstNotStartedPhase = phases.find((phase) => phase.status === "not_started");

  return firstNotStartedPhase?.phaseNumber ?? phases.length;
}
