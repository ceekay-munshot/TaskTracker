/**
 * Munshot OS — domain types.
 * Const arrays double as the single source of truth for union types AND
 * as ready-made option lists for form dropdowns / filters.
 */

/* ----------------------------------------------------------------------------
 * Enumerations
 * ------------------------------------------------------------------------- */

export const TEAM_ROLES = [
  'Founder',
  'Team Lead - Intern',
  'Equity Research Intern',
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const MEMBER_STATUSES = ['Active', 'On Leave', 'Inactive'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const CLIENT_STATUSES = ['Active', 'Prospect', 'On Hold', 'Churned'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const WORK_ITEM_TYPES = ['Dashboard', 'Agent', 'Workflow'] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const WORK_ITEM_STATUSES = [
  'Not Started',
  'In Progress',
  'Blocked',
  'In Review',
  'Live',
  'Completed',
] as const;
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const HEALTH_SCORES = ['Green', 'Yellow', 'Red'] as const;
export type HealthScore = (typeof HEALTH_SCORES)[number];

export const STEP_STATUSES = [
  'Not Started',
  'In Progress',
  'Done',
  'Not Required',
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const REVIEW_STATUSES = [
  'Pending',
  'Reviewed',
  'Changes Requested',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CLIENT_FEEDBACK_STATUSES = [
  'No Feedback Yet',
  'Pending',
  'Received',
  'Addressed',
] as const;
export type ClientFeedbackStatus = (typeof CLIENT_FEEDBACK_STATUSES)[number];

export const WORKFLOW_STAGES = [
  'Client Meeting',
  'Recording Reviewed',
  'Requirement Understood',
  'ChatGPT Master Prompt Created',
  'Claude Build Started',
  'Dashboard/Agent Built',
  'Agent Integration Optional',
  'Team Review',
  'Vipul Approval',
  'Live on Munshot',
  'Chiraag Review',
  'Client Demo',
  'Client Feedback',
  'Improvement Backlog',
  'Final Completion',
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export const TASK_STATUSES = ['To Do', 'In Progress', 'Blocked', 'Done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MEETING_TYPES = [
  'Kickoff',
  'Client Call',
  'Internal Sync',
  'Demo',
  'Feedback Call',
  'Founder Review',
] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export const MEETING_FREQUENCIES = [
  'One-time',
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
] as const;
export type MeetingFrequency = (typeof MEETING_FREQUENCIES)[number];

export const MEETING_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const RECORDING_TYPES = [
  'Client Meeting',
  'Feedback Call',
  'Demo',
  'Founder Review',
  'Internal Review',
] as const;
export type RecordingType = (typeof RECORDING_TYPES)[number];

export const FEEDBACK_SOURCES = [
  'Original Client',
  'Other Client',
  'Vipul',
  'Chiraag',
  'Internal Team',
] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export const FEEDBACK_STATUSES = [
  'Open',
  'Planned',
  'In Progress',
  'Resolved',
  'Wont Do',
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const EFFORT_LEVELS = ['Low', 'Medium', 'High'] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export const IMPACT_LEVELS = ['Low', 'Medium', 'High'] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

export const TRANSFER_STATUSES = [
  'Pending',
  'Approved',
  'Rejected',
  'Completed',
] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_REASONS = [
  'Workload Balancing',
  'Expertise Fit',
  'Deadline Pressure',
  'Client-Specific Knowledge',
  'Member Unavailable',
  'Skill Development',
] as const;
export type TransferReason = (typeof TRANSFER_REASONS)[number];

export const DEMO_READINESS_STATUSES = [
  'Pending',
  'Done',
  'Not Required',
] as const;
export type DemoReadinessStatus = (typeof DEMO_READINESS_STATUSES)[number];

export const DEMO_READINESS_BADGES = [
  'Not Ready',
  'Almost Ready',
  'Demo Ready',
] as const;
export type DemoReadinessBadge = (typeof DEMO_READINESS_BADGES)[number];

export const TIMELINE_EVENT_TYPES = [
  'created',
  'stage_change',
  'status_change',
  'recording_linked',
  'transfer_requested',
  'transfer_approved',
  'transfer_rejected',
  'transfer_completed',
  'approval',
  'review',
  'feedback_added',
  'improvement_added',
  'task_added',
  'meeting_added',
  'went_live',
  'completed',
  'note',
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

/* ----------------------------------------------------------------------------
 * Entities
 * ------------------------------------------------------------------------- */

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  city: string;
  qualification: string;
  expertise: string[];
  photoUrl: string;
  joinDate: string;
  reportsToId: string | null;
  status: MemberStatus;
  email: string;
  phone: string;
  bio: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  pointOfContact: string;
  pocEmail: string;
  pocPhone: string;
  logoUrl: string;
  status: ClientStatus;
  notes: string;
  /** 1 (low) – 10 (strategic / flagship) */
  importanceScore: number;
}

export interface WorkLink {
  label: string;
  url: string;
}

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  clientId: string;
  ownerId: string;
  originalOwnerId: string;
  previousOwnerIds: string[];
  transferHistoryIds: string[];
  linkedMeetingRecordingIds: string[];
  hasPendingTransfer: boolean;
  priority: Priority;
  currentStage: WorkflowStage;
  status: WorkItemStatus;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  /** 0 – 100 */
  progress: number;
  description: string;
  chatgptPromptStatus: StepStatus;
  claudeBuildStatus: StepStatus;
  agentIntegrationRequired: boolean;
  agentIntegrationStatus: StepStatus;
  vipulApprovalStatus: ApprovalStatus;
  chiraagReviewStatus: ReviewStatus;
  clientFeedbackStatus: ClientFeedbackStatus;
  improvementCount: number;
  links: WorkLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workItemId: string | null;
  ownerId: string;
  clientId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  clientId: string | null;
  ownerId: string;
  date: string;
  time: string;
  /** minutes */
  duration: number;
  frequency: MeetingFrequency;
  notes: string;
  meetingType: MeetingType;
  status: MeetingStatus;
}

export interface ClientMeetingRecording {
  id: string;
  title: string;
  youtubeUrl: string;
  clientId: string | null;
  ownerId: string;
  meetingDate: string;
  meetingType: RecordingType;
  notes: string;
  linkedWorkItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  workItemId: string | null;
  clientId: string | null;
  source: FeedbackSource;
  feedbackText: string;
  priority: Priority;
  effort: EffortLevel;
  businessImpact: ImpactLevel;
  frequencyCount: number;
  status: FeedbackStatus;
  createdAt: string;
}

export interface WorkTransfer {
  id: string;
  workItemId: string;
  fromOwnerId: string;
  toOwnerId: string;
  requestedById: string;
  approvedById: string | null;
  transferDate: string;
  reason: TransferReason;
  notes: string;
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  workItemId: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  actorId: string | null;
  date: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface DemoReadinessItem {
  id: string;
  workItemId: string;
  label: string;
  status: DemoReadinessStatus;
  ownerId: string | null;
  notes: string;
}

export interface WorkflowStageConfig {
  id: string;
  stage: WorkflowStage;
  order: number;
  shortLabel: string;
  description: string;
}

/* ----------------------------------------------------------------------------
 * Aggregate persisted state
 * ------------------------------------------------------------------------- */

export interface AppData {
  teamMembers: TeamMember[];
  clients: Client[];
  workItems: WorkItem[];
  tasks: Task[];
  meetings: Meeting[];
  recordings: ClientMeetingRecording[];
  feedback: Feedback[];
  transfers: WorkTransfer[];
  timelineEvents: TimelineEvent[];
  demoReadinessItems: DemoReadinessItem[];
  workflowStages: WorkflowStageConfig[];
}

export type EntityCollection = keyof AppData;

/* ----------------------------------------------------------------------------
 * Derived / computed result shapes
 * ------------------------------------------------------------------------- */

export interface HealthResult {
  score: HealthScore;
  /** Risk points — higher is worse. */
  points: number;
  reasons: string[];
}

export interface DemoReadinessResult {
  done: number;
  applicable: number;
  total: number;
  percent: number;
  badge: DemoReadinessBadge;
}

export interface RankedImprovement {
  feedback: Feedback;
  priorityScore: number;
  breakdown: {
    clientImportance: number;
    businessImpact: number;
    frequency: number;
    effortPenalty: number;
  };
}

export interface MemberWorkloadStats {
  memberId: string;
  activeWork: number;
  urgentTasks: number;
  overdueItems: number;
  blockedWork: number;
  pendingApprovals: number;
  transfersReceived: number;
  /** 0 – 100 capacity pressure */
  capacityRisk: number;
}

export interface MemberPerformanceStats {
  memberId: string;
  completedWork: number;
  onTimeRate: number;
  activeWorkload: number;
  feedbackClosure: number;
  averageProgress: number;
  blockedCount: number;
  workReceived: number;
  workTransferredOut: number;
  completedBeforeTransfer: number;
  completedAfterTransfer: number;
  pendingTransferredWork: number;
  recordingsHandled: number;
  averageHealthPoints: number;
  demoReadyProjects: number;
  performanceScore: number;
  badge: 'Excellent' | 'Strong' | 'Needs Attention' | 'Overloaded';
}
