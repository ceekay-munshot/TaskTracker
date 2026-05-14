/**
 * Centralised colour system. Maps every domain enum to a named swatch so the
 * whole app stays visually consistent. Each swatch exposes Tailwind class
 * fragments AND a raw hex for Recharts.
 */
import type {
  ApprovalStatus,
  ClientFeedbackStatus,
  ClientStatus,
  DemoReadinessBadge,
  DemoReadinessStatus,
  FeedbackStatus,
  HealthScore,
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
} from '@/types';

export interface Swatch {
  /** pill background + text */
  chip: string;
  /** small status dot background */
  dot: string;
  /** plain text colour */
  text: string;
  /** soft tinted background */
  soft: string;
  /** solid background (progress bars / kanban accents) */
  solid: string;
  /** border colour */
  border: string;
  /** raw hex for charts */
  hex: string;
}

export type ColorName =
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'sky'
  | 'cyan'
  | 'blue'
  | 'slate'
  | 'orange'
  | 'teal'
  | 'pink'
  | 'lime';

export const COLORS: Record<ColorName, Swatch> = {
  emerald: {
    chip: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50',
    solid: 'bg-emerald-500',
    border: 'border-emerald-200',
    hex: '#10b981',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    soft: 'bg-amber-50',
    solid: 'bg-amber-500',
    border: 'border-amber-200',
    hex: '#f59e0b',
  },
  rose: {
    chip: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    text: 'text-rose-600',
    soft: 'bg-rose-50',
    solid: 'bg-rose-500',
    border: 'border-rose-200',
    hex: '#f43f5e',
  },
  indigo: {
    chip: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    text: 'text-indigo-600',
    soft: 'bg-indigo-50',
    solid: 'bg-indigo-500',
    border: 'border-indigo-200',
    hex: '#6366f1',
  },
  violet: {
    chip: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    text: 'text-violet-600',
    soft: 'bg-violet-50',
    solid: 'bg-violet-500',
    border: 'border-violet-200',
    hex: '#8b5cf6',
  },
  fuchsia: {
    chip: 'bg-fuchsia-100 text-fuchsia-700',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-600',
    soft: 'bg-fuchsia-50',
    solid: 'bg-fuchsia-500',
    border: 'border-fuchsia-200',
    hex: '#d946ef',
  },
  sky: {
    chip: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    text: 'text-sky-600',
    soft: 'bg-sky-50',
    solid: 'bg-sky-500',
    border: 'border-sky-200',
    hex: '#0ea5e9',
  },
  cyan: {
    chip: 'bg-cyan-100 text-cyan-700',
    dot: 'bg-cyan-500',
    text: 'text-cyan-600',
    soft: 'bg-cyan-50',
    solid: 'bg-cyan-500',
    border: 'border-cyan-200',
    hex: '#06b6d4',
  },
  blue: {
    chip: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    text: 'text-blue-600',
    soft: 'bg-blue-50',
    solid: 'bg-blue-500',
    border: 'border-blue-200',
    hex: '#3b82f6',
  },
  slate: {
    chip: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    text: 'text-slate-500',
    soft: 'bg-slate-50',
    solid: 'bg-slate-400',
    border: 'border-slate-200',
    hex: '#94a3b8',
  },
  orange: {
    chip: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
    text: 'text-orange-600',
    soft: 'bg-orange-50',
    solid: 'bg-orange-500',
    border: 'border-orange-200',
    hex: '#f97316',
  },
  teal: {
    chip: 'bg-teal-100 text-teal-700',
    dot: 'bg-teal-500',
    text: 'text-teal-600',
    soft: 'bg-teal-50',
    solid: 'bg-teal-500',
    border: 'border-teal-200',
    hex: '#14b8a6',
  },
  pink: {
    chip: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-500',
    text: 'text-pink-600',
    soft: 'bg-pink-50',
    solid: 'bg-pink-500',
    border: 'border-pink-200',
    hex: '#ec4899',
  },
  lime: {
    chip: 'bg-lime-100 text-lime-700',
    dot: 'bg-lime-500',
    text: 'text-lime-600',
    soft: 'bg-lime-50',
    solid: 'bg-lime-500',
    border: 'border-lime-200',
    hex: '#84cc16',
  },
};

export function swatch(name: ColorName): Swatch {
  return COLORS[name];
}

/** Ordered palette for charts with many series. */
export const CHART_COLORS: string[] = [
  '#6366f1',
  '#d946ef',
  '#10b981',
  '#f59e0b',
  '#0ea5e9',
  '#f43f5e',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#ec4899',
  '#84cc16',
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/* ----------------------------- enum → colour ----------------------------- */

export function healthColor(h: HealthScore): ColorName {
  return h === 'Green' ? 'emerald' : h === 'Yellow' ? 'amber' : 'rose';
}

export function priorityColor(p: Priority): ColorName {
  switch (p) {
    case 'Critical':
      return 'rose';
    case 'High':
      return 'orange';
    case 'Medium':
      return 'amber';
    default:
      return 'slate';
  }
}

export function workItemStatusColor(s: WorkItemStatus): ColorName {
  switch (s) {
    case 'Not Started':
      return 'slate';
    case 'In Progress':
      return 'indigo';
    case 'Blocked':
      return 'rose';
    case 'In Review':
      return 'violet';
    case 'Live':
      return 'cyan';
    case 'Completed':
      return 'emerald';
  }
}

export function taskStatusColor(s: TaskStatus): ColorName {
  switch (s) {
    case 'To Do':
      return 'slate';
    case 'In Progress':
      return 'indigo';
    case 'Blocked':
      return 'rose';
    case 'Done':
      return 'emerald';
  }
}

export function transferStatusColor(s: TransferStatus): ColorName {
  switch (s) {
    case 'Pending':
      return 'amber';
    case 'Approved':
      return 'sky';
    case 'Rejected':
      return 'rose';
    case 'Completed':
      return 'emerald';
  }
}

export function feedbackStatusColor(s: FeedbackStatus): ColorName {
  switch (s) {
    case 'Open':
      return 'rose';
    case 'Planned':
      return 'amber';
    case 'In Progress':
      return 'indigo';
    case 'Resolved':
      return 'emerald';
    case 'Wont Do':
      return 'slate';
  }
}

export function workItemTypeColor(t: WorkItemType): ColorName {
  switch (t) {
    case 'Dashboard':
      return 'indigo';
    case 'Agent':
      return 'fuchsia';
    case 'Workflow':
      return 'teal';
  }
}

export function demoBadgeColor(b: DemoReadinessBadge): ColorName {
  switch (b) {
    case 'Demo Ready':
      return 'emerald';
    case 'Almost Ready':
      return 'amber';
    case 'Not Ready':
      return 'rose';
  }
}

export function demoStatusColor(s: DemoReadinessStatus): ColorName {
  switch (s) {
    case 'Done':
      return 'emerald';
    case 'Pending':
      return 'amber';
    case 'Not Required':
      return 'slate';
  }
}

export function stepStatusColor(s: StepStatus): ColorName {
  switch (s) {
    case 'Done':
      return 'emerald';
    case 'In Progress':
      return 'indigo';
    case 'Not Started':
      return 'slate';
    case 'Not Required':
      return 'slate';
  }
}

export function approvalStatusColor(s: ApprovalStatus): ColorName {
  switch (s) {
    case 'Approved':
      return 'emerald';
    case 'Pending':
      return 'amber';
    case 'Rejected':
      return 'rose';
  }
}

export function reviewStatusColor(s: ReviewStatus): ColorName {
  switch (s) {
    case 'Reviewed':
      return 'emerald';
    case 'Pending':
      return 'amber';
    case 'Changes Requested':
      return 'rose';
  }
}

export function clientFeedbackStatusColor(s: ClientFeedbackStatus): ColorName {
  switch (s) {
    case 'Addressed':
      return 'emerald';
    case 'Received':
      return 'sky';
    case 'Pending':
      return 'amber';
    case 'No Feedback Yet':
      return 'slate';
  }
}

export function clientStatusColor(s: ClientStatus): ColorName {
  switch (s) {
    case 'Active':
      return 'emerald';
    case 'Prospect':
      return 'sky';
    case 'On Hold':
      return 'amber';
    case 'Churned':
      return 'rose';
  }
}

export function memberStatusColor(s: MemberStatus): ColorName {
  switch (s) {
    case 'Active':
      return 'emerald';
    case 'On Leave':
      return 'amber';
    case 'Inactive':
      return 'slate';
  }
}

export function meetingTypeColor(t: MeetingType): ColorName {
  switch (t) {
    case 'Kickoff':
      return 'violet';
    case 'Client Call':
      return 'indigo';
    case 'Internal Sync':
      return 'slate';
    case 'Demo':
      return 'fuchsia';
    case 'Feedback Call':
      return 'orange';
    case 'Founder Review':
      return 'cyan';
  }
}

export function meetingStatusColor(s: MeetingStatus): ColorName {
  switch (s) {
    case 'Scheduled':
      return 'indigo';
    case 'Completed':
      return 'emerald';
    case 'Cancelled':
      return 'slate';
  }
}

export function recordingTypeColor(t: RecordingType): ColorName {
  switch (t) {
    case 'Client Meeting':
      return 'indigo';
    case 'Feedback Call':
      return 'orange';
    case 'Demo':
      return 'fuchsia';
    case 'Founder Review':
      return 'cyan';
    case 'Internal Review':
      return 'slate';
  }
}

/** Capacity-risk → swatch (used by the workload heatmap). */
export function riskColor(risk: number): ColorName {
  if (risk >= 75) return 'rose';
  if (risk >= 50) return 'orange';
  if (risk >= 28) return 'amber';
  return 'emerald';
}
