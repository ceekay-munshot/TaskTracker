/**
 * Improvement Backlog Prioritizer.
 * priorityScore = client importance + business impact + repeat frequency − effort
 */
import type { Client, Feedback, RankedImprovement } from '@/types';

const IMPACT_WEIGHT: Record<Feedback['businessImpact'], number> = {
  Low: 4,
  Medium: 9,
  High: 15,
};

const EFFORT_WEIGHT: Record<Feedback['effort'], number> = {
  Low: 2,
  Medium: 6,
  High: 12,
};

export function rankImprovement(
  feedback: Feedback,
  client: Client | undefined,
): RankedImprovement {
  const clientImportance = client ? client.importanceScore : 5;
  const businessImpact = IMPACT_WEIGHT[feedback.businessImpact];
  const frequency = Math.round(Math.min(feedback.frequencyCount, 12) * 1.8);
  const effortPenalty = EFFORT_WEIGHT[feedback.effort];
  const priorityScore = Math.max(
    0,
    Math.round(clientImportance + businessImpact + frequency - effortPenalty),
  );
  return {
    feedback,
    priorityScore,
    breakdown: { clientImportance, businessImpact, frequency, effortPenalty },
  };
}

export function rankImprovements(
  feedbackList: Feedback[],
  resolveClient: (id: string | null) => Client | undefined,
): RankedImprovement[] {
  return feedbackList
    .map((f) => rankImprovement(f, resolveClient(f.clientId)))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Feedback that still belongs in the actionable backlog. */
export function isBacklogFeedback(f: Feedback): boolean {
  return (
    f.status === 'Open' || f.status === 'Planned' || f.status === 'In Progress'
  );
}
