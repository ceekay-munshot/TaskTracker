/**
 * AI Project Health Score.
 * Converts a basket of risk signals into Green / Yellow / Red plus the
 * human-readable reasons that drove the score.
 */
import type { Client, HealthResult, WorkItem } from '@/types';
import { daysBetween, daysOverdue, daysUntil, todayISO } from './dates';

export interface HealthContext {
  openFeedbackCount: number;
  ownerActiveCount: number;
  client: Client | undefined;
}

export function computeHealth(
  item: WorkItem,
  ctx: HealthContext,
): HealthResult {
  if (item.status === 'Completed') {
    return { score: 'Green', points: 0, reasons: ['Delivered & completed'] };
  }

  const reasons: string[] = [];
  let points = 0;

  // Ownership — unassigned work is a real delivery risk
  if (!item.ownerId) {
    points += 12;
    reasons.push('Not yet assigned to an owner');
  }

  // Due-date risk
  const overdue = daysOverdue(item.dueDate);
  if (overdue > 0) {
    points += Math.min(8 + overdue * 1.6, 34);
    reasons.push(`Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`);
  } else {
    const until = daysUntil(item.dueDate);
    if (until <= 5 && item.progress < 75) {
      points += (6 - until) * 2.4;
      reasons.push(
        `Due in ${until} day${until === 1 ? '' : 's'} at ${item.progress}% progress`,
      );
    }
  }

  // Blocked
  if (item.status === 'Blocked') {
    points += 24;
    reasons.push('Currently blocked');
  }

  if (item.hasPendingTransfer) {
    points += 9;
    reasons.push('Pending ownership transfer');
  }

  // Feedback backlog
  if (ctx.openFeedbackCount > 0) {
    points += Math.min(ctx.openFeedbackCount * 4.5, 20);
    reasons.push(
      `${ctx.openFeedbackCount} open feedback item${
        ctx.openFeedbackCount === 1 ? '' : 's'
      }`,
    );
  }

  // Owner workload pressure
  if (item.ownerId && ctx.ownerActiveCount > 5) {
    points += Math.min((ctx.ownerActiveCount - 5) * 3.5, 16);
    reasons.push(`Owner carrying ${ctx.ownerActiveCount} active items`);
  }

  // Transfer churn
  if (item.transferHistoryIds.length >= 2) {
    points += item.transferHistoryIds.length * 3;
    reasons.push(`Transferred ${item.transferHistoryIds.length} times`);
  }

  // Progress vs schedule
  const totalSpan = Math.max(1, daysBetween(item.startDate, item.dueDate));
  const elapsed = Math.max(0, daysBetween(item.startDate, todayISO()));
  const expected = Math.min(100, (elapsed / totalSpan) * 100);
  if (expected - item.progress > 22 && item.status !== 'Live') {
    points += Math.min((expected - item.progress) * 0.35, 16);
    reasons.push(
      `Progress ${item.progress}% vs ~${Math.round(expected)}% expected`,
    );
  }

  // Amplifiers
  if (
    (item.priority === 'Critical' || item.priority === 'High') &&
    points > 8
  ) {
    points += 5;
  }
  if (ctx.client && ctx.client.importanceScore >= 8 && points > 10) {
    points *= 1.18;
    reasons.push(`High-importance client (${ctx.client.name})`);
  }

  points = Math.round(points);

  let score: HealthResult['score'] = 'Green';
  if (points > 30) score = 'Red';
  else if (points > 13) score = 'Yellow';

  if (reasons.length === 0) reasons.push('On track — no risk flags');

  return { score, points, reasons };
}
