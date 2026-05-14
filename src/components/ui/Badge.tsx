import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import {
  approvalStatusColor,
  clientFeedbackStatusColor,
  clientStatusColor,
  demoBadgeColor,
  demoStatusColor,
  feedbackStatusColor,
  healthColor,
  meetingStatusColor,
  meetingTypeColor,
  memberStatusColor,
  priorityColor,
  recordingTypeColor,
  reviewStatusColor,
  stepStatusColor,
  swatch,
  taskStatusColor,
  transferStatusColor,
  workItemStatusColor,
  workItemTypeColor,
  type ColorName,
} from '@/utils/palette';
import type {
  ApprovalStatus,
  ClientFeedbackStatus,
  ClientStatus,
  DemoReadinessBadge as DemoReadinessBadgeType,
  DemoReadinessStatus,
  FeedbackStatus,
  HealthResult,
  MeetingStatus,
  MeetingType,
  MemberStatus,
  Priority,
  RecordingType,
  ReviewStatus,
  StepStatus,
  TaskStatus,
  TransferStatus,
  WorkItemStatus,
  WorkItemType,
  WorkflowStage,
} from '@/types';

interface BadgeProps {
  color: ColorName;
  children: ReactNode;
  dot?: boolean;
  soft?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  title?: string;
}

export function Badge({
  color,
  children,
  dot = false,
  soft = false,
  size = 'sm',
  className,
  title,
}: BadgeProps) {
  const s = swatch(color);
  return (
    <span
      title={title}
      className={cn(
        'chip',
        soft ? cn(s.soft, s.text) : s.chip,
        size === 'xs' && 'px-2 py-0.5 text-[10px]',
        size === 'md' && 'px-3 py-1.5 text-xs',
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', s.dot)} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkItemStatus }) {
  return (
    <Badge color={workItemStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge color={priorityColor(priority)}>{priority}</Badge>;
}

export function ProjectHealthBadge({
  health,
  showPoints = false,
  size = 'sm',
}: {
  health: HealthResult;
  showPoints?: boolean;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <Badge
      color={healthColor(health.score)}
      dot
      size={size}
      title={health.reasons.join(' · ')}
    >
      {health.score}
      {showPoints ? ` · ${health.points}` : ''}
    </Badge>
  );
}

export function WorkflowStageBadge({
  stage,
  size = 'sm',
}: {
  stage: WorkflowStage;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <Badge color="violet" soft size={size}>
      {stage}
    </Badge>
  );
}

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return (
    <Badge color={transferStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: WorkItemType }) {
  return (
    <Badge color={workItemTypeColor(type)} soft>
      {type}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge color={taskStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <Badge color={feedbackStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return (
    <Badge color={stepStatusColor(status)} soft size="xs">
      {status}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge color={approvalStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge color={reviewStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function ClientFeedbackBadge({
  status,
}: {
  status: ClientFeedbackStatus;
}) {
  return (
    <Badge color={clientFeedbackStatusColor(status)} soft>
      {status}
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge color={clientStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <Badge color={memberStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function MeetingTypeBadge({ type }: { type: MeetingType }) {
  return (
    <Badge color={meetingTypeColor(type)} soft>
      {type}
    </Badge>
  );
}

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <Badge color={meetingStatusColor(status)} dot>
      {status}
    </Badge>
  );
}

export function RecordingTypeBadge({ type }: { type: RecordingType }) {
  return (
    <Badge color={recordingTypeColor(type)} soft>
      {type}
    </Badge>
  );
}

export function ReadinessBadge({
  badge,
  percent,
}: {
  badge: DemoReadinessBadgeType;
  percent?: number;
}) {
  return (
    <Badge color={demoBadgeColor(badge)} dot>
      {badge}
      {percent !== undefined ? ` · ${percent}%` : ''}
    </Badge>
  );
}

export function DemoStatusBadge({ status }: { status: DemoReadinessStatus }) {
  return (
    <Badge color={demoStatusColor(status)} soft size="xs">
      {status}
    </Badge>
  );
}

/** Generic count pill. */
export function CountPill({
  count,
  color = 'slate',
}: {
  count: number;
  color?: ColorName;
}) {
  const s = swatch(color);
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
        s.chip,
      )}
    >
      {count}
    </span>
  );
}
