/**
 * Workload + performance analytics.
 * Transfer-aware: a member is only measured on work they currently own or
 * personally completed — work transferred away mid-flight never counts
 * against them.
 */
import type {
  AppData,
  MemberPerformanceStats,
  MemberWorkloadStats,
  TeamMember,
  WorkItem,
} from '@/types';
import { daysBetween, isOverdue } from './dates';

const isActive = (w: WorkItem): boolean => w.status !== 'Completed';

export function computeMemberWorkload(
  member: TeamMember,
  data: AppData,
): MemberWorkloadStats {
  const ownedWork = data.workItems.filter((w) => w.ownerIds.includes(member.id));
  const ownedTasks = data.tasks.filter(
    (t) => t.ownerId === member.id && t.status !== 'Done',
  );

  const activeWork = ownedWork.filter(isActive).length;
  const urgentTasks = ownedTasks.filter(
    (t) =>
      t.priority === 'Critical' ||
      t.priority === 'High' ||
      isOverdue(t.dueDate),
  ).length;
  const overdueItems =
    ownedWork.filter((w) => isActive(w) && isOverdue(w.dueDate)).length +
    ownedTasks.filter((t) => isOverdue(t.dueDate)).length;
  const blockedWork =
    ownedWork.filter((w) => w.status === 'Blocked').length +
    ownedTasks.filter((t) => t.status === 'Blocked').length;
  const pendingApprovals = ownedWork.filter(
    (w) =>
      isActive(w) &&
      (w.vipulApprovalStatus === 'Pending' ||
        w.chiraagReviewStatus === 'Pending' ||
        w.chiraagReviewStatus === 'Changes Requested'),
  ).length;
  const transfersReceived = data.transfers.filter(
    (t) =>
      t.toOwnerId === member.id &&
      (t.status === 'Approved' || t.status === 'Completed'),
  ).length;

  const capacityRisk = Math.min(
    100,
    Math.round(
      activeWork * 9 +
        urgentTasks * 5 +
        overdueItems * 11 +
        blockedWork * 9 +
        pendingApprovals * 4,
    ),
  );

  return {
    memberId: member.id,
    activeWork,
    urgentTasks,
    overdueItems,
    blockedWork,
    pendingApprovals,
    transfersReceived,
    capacityRisk,
  };
}

export function computeMemberPerformance(
  member: TeamMember,
  data: AppData,
  healthPointsByItem: Map<string, number>,
  demoReadyItemIds: Set<string>,
): MemberPerformanceStats {
  const allOwned = data.workItems.filter((w) => w.ownerIds.includes(member.id));
  const completedOwned = allOwned.filter((w) => w.status === 'Completed');
  const activeOwned = allOwned.filter(isActive);

  const completedWork = completedOwned.length;
  const activeWorkload = activeOwned.length;
  const blockedCount = allOwned.filter((w) => w.status === 'Blocked').length;

  // On-time rate — only items the member personally finished, with dates
  const datedCompletions = completedOwned.filter(
    (w) => w.completionDate && w.dueDate,
  );
  const onTimeCount = datedCompletions.filter(
    (w) => daysBetween(w.completionDate as string, w.dueDate) >= 0,
  ).length;
  const onTimeRate =
    datedCompletions.length === 0
      ? 0
      : onTimeCount / datedCompletions.length;

  // Feedback closure across owned work
  const ownedIds = new Set(allOwned.map((w) => w.id));
  const ownedFeedback = data.feedback.filter(
    (f) => f.workItemId !== null && ownedIds.has(f.workItemId),
  );
  const closedFeedback = ownedFeedback.filter(
    (f) => f.status === 'Resolved' || f.status === 'Wont Do',
  ).length;
  const feedbackClosure =
    ownedFeedback.length === 0 ? 0 : closedFeedback / ownedFeedback.length;

  const averageProgress =
    allOwned.length === 0
      ? 0
      : Math.round(
          allOwned.reduce(
            (sum, w) => sum + (w.status === 'Completed' ? 100 : w.progress),
            0,
          ) / allOwned.length,
        );

  // Transfer-aware counters
  const workReceived = data.transfers.filter(
    (t) =>
      t.toOwnerId === member.id &&
      (t.status === 'Approved' || t.status === 'Completed'),
  ).length;
  const workTransferredOut = data.transfers.filter(
    (t) =>
      t.fromOwnerId === member.id &&
      (t.status === 'Approved' || t.status === 'Completed'),
  ).length;
  const completedBeforeTransfer = completedOwned.filter(
    (w) => w.originalOwnerId === member.id,
  ).length;
  const completedAfterTransfer = completedOwned.filter(
    (w) => w.originalOwnerId !== member.id,
  ).length;
  const pendingTransferredWork = activeOwned.filter(
    (w) => w.originalOwnerId !== member.id,
  ).length;

  const recordingsHandled = data.recordings.filter(
    (r) => r.ownerId === member.id,
  ).length;

  const activeHealthPoints = activeOwned.map(
    (w) => healthPointsByItem.get(w.id) ?? 0,
  );
  const averageHealthPoints =
    activeHealthPoints.length === 0
      ? 0
      : Math.round(
          activeHealthPoints.reduce((s, p) => s + p, 0) /
            activeHealthPoints.length,
        );

  const demoReadyProjects = allOwned.filter((w) =>
    demoReadyItemIds.has(w.id),
  ).length;

  // Weighted performance score (0 – 100)
  const sCompleted = (Math.min(completedWork, 12) / 12) * 24;
  const sOnTime = datedCompletions.length === 0 ? 10 : onTimeRate * 20;
  const sBlocked = (1 - Math.min(blockedCount, 5) / 5) * 10;
  const sFeedback = ownedFeedback.length === 0 ? 8 : feedbackClosure * 12;
  const sProgress = (averageProgress / 100) * 10;
  const sHealth = (1 - Math.min(averageHealthPoints, 40) / 40) * 14;
  const sDemo = (Math.min(demoReadyProjects, 5) / 5) * 10;
  const performanceScore = Math.round(
    sCompleted + sOnTime + sBlocked + sFeedback + sProgress + sHealth + sDemo,
  );

  const { capacityRisk } = computeMemberWorkload(member, data);
  let badge: MemberPerformanceStats['badge'];
  if (performanceScore >= 78) badge = 'Excellent';
  else if (capacityRisk >= 78) badge = 'Overloaded';
  else if (performanceScore >= 58) badge = 'Strong';
  else badge = 'Needs Attention';

  return {
    memberId: member.id,
    completedWork,
    onTimeRate,
    activeWorkload,
    feedbackClosure,
    averageProgress,
    blockedCount,
    workReceived,
    workTransferredOut,
    completedBeforeTransfer,
    completedAfterTransfer,
    pendingTransferredWork,
    recordingsHandled,
    averageHealthPoints,
    demoReadyProjects,
    performanceScore,
    badge,
  };
}
