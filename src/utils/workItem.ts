import type { WorkItem, WorkItemStatus, WorkflowStageConfig } from '@/types';

/**
 * Show "Completed" only when the work item has reached the final
 * workflow stage. Otherwise treat a "Completed" status flag as
 * "In Progress" so the badge tracks workflow progress, not just the
 * raw status field.
 */
export function effectiveStatus(
  workItem: WorkItem,
  workflowStages: WorkflowStageConfig[],
): WorkItemStatus {
  if (workItem.status !== 'Completed') return workItem.status;
  const lastStage = workflowStages
    .slice()
    .sort((a, b) => b.order - a.order)[0]?.stage;
  if (lastStage && workItem.currentStage === lastStage) {
    return 'Completed';
  }
  return 'In Progress';
}
