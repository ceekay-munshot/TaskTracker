/**
 * Munshot OS — centralised localStorage-backed store.
 * Single source of truth: every CRUD + domain operation flows through here,
 * and all derived views (health, demo readiness, workload, performance)
 * recompute automatically.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cloneSeedData } from '@/data/mockData';
import {
  type AppData,
  type ApprovalStatus,
  type Client,
  type ClientFeedbackStatus,
  type ClientMeetingRecording,
  type DemoReadinessItem,
  type DemoReadinessResult,
  type Feedback,
  type HealthResult,
  type Meeting,
  type MemberPerformanceStats,
  type MemberWorkloadStats,
  type ReviewStatus,
  type StepStatus,
  type Task,
  type TeamMember,
  type TimelineEvent,
  type TimelineEventType,
  type WorkflowStage,
  type WorkflowStageConfig,
  type WorkItem,
  type WorkItemStatus,
  type WorkItemType,
  type WorkLink,
  type WorkTransfer,
  type Priority,
} from '@/types';
import { computeDemoReadiness, DEFAULT_READINESS_LABELS } from '@/utils/demoReadiness';
import { computeHealth } from '@/utils/health';
import { isBacklogFeedback } from '@/utils/improvements';
import {
  computeMemberPerformance,
  computeMemberWorkload,
} from '@/utils/performance';
import { nowISO, todayISO } from '@/utils/dates';
import { uid } from '@/utils/ids';
import { groupBy } from '@/utils/collections';

const STORAGE_KEY = 'munshot-os-data-v1';

/* ------------------------------------------------------------------ */
/* Persistence                                                        */
/* ------------------------------------------------------------------ */

interface LegacyClient extends Omit<Client, 'pocs'> {
  pocs?: Client['pocs'];
  pointOfContact?: string;
  pocEmail?: string;
  pocPhone?: string;
}

function migrateClient(raw: LegacyClient): Client {
  if (Array.isArray(raw.pocs) && raw.pocs.length > 0) {
    const { pointOfContact: _p, pocEmail: _e, pocPhone: _ph, ...rest } = raw;
    return rest as Client;
  }
  const legacyName = raw.pointOfContact?.trim() ?? '';
  const pocs = legacyName
    ? [
        {
          id: uid('poc'),
          name: legacyName,
          email: raw.pocEmail ?? '',
          phone: raw.pocPhone ?? '',
          role: 'Primary',
        },
      ]
    : [];
  const { pointOfContact: _p, pocEmail: _e, pocPhone: _ph, ...rest } = raw;
  return { ...(rest as Omit<Client, 'pocs'>), pocs };
}

function ensureShape(raw: Partial<AppData>): AppData {
  const fallbackStages = cloneSeedData().workflowStages;
  const clients = (raw.clients ?? []) as LegacyClient[];
  return {
    teamMembers: raw.teamMembers ?? [],
    clients: clients.map(migrateClient),
    workItems: (raw.workItems ?? []).map((w) => ({
      ...w,
      pocId: w.pocId ?? null,
    })),
    tasks: raw.tasks ?? [],
    meetings: raw.meetings ?? [],
    recordings: raw.recordings ?? [],
    feedback: raw.feedback ?? [],
    transfers: raw.transfers ?? [],
    timelineEvents: raw.timelineEvents ?? [],
    demoReadinessItems: raw.demoReadinessItems ?? [],
    workflowStages:
      raw.workflowStages && raw.workflowStages.length > 0
        ? raw.workflowStages
        : fallbackStages,
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      if (parsed && typeof parsed === 'object') {
        return ensureShape(parsed);
      }
    }
  } catch {
    /* corrupted storage — fall through to seed */
  }
  return cloneSeedData();
}

function emptyData(): AppData {
  return {
    teamMembers: [],
    clients: [],
    workItems: [],
    tasks: [],
    meetings: [],
    recordings: [],
    feedback: [],
    transfers: [],
    timelineEvents: [],
    demoReadinessItems: [],
    workflowStages: cloneSeedData().workflowStages,
  };
}

/* ------------------------------------------------------------------ */
/* Input shapes                                                       */
/* ------------------------------------------------------------------ */

export interface WorkItemInput {
  title: string;
  type: WorkItemType;
  clientId: string;
  pocId: string | null;
  ownerId: string;
  priority: Priority;
  currentStage: WorkflowStage;
  status: WorkItemStatus;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  progress: number;
  description: string;
  chatgptPromptStatus: StepStatus;
  claudeBuildStatus: StepStatus;
  agentIntegrationRequired: boolean;
  agentIntegrationStatus: StepStatus;
  vipulApprovalStatus: ApprovalStatus;
  chiraagReviewStatus: ReviewStatus;
  clientFeedbackStatus: ClientFeedbackStatus;
  links: WorkLink[];
}

export interface TransferInput {
  workItemId: string;
  fromOwnerId: string;
  toOwnerId: string;
  requestedById: string;
  approvedById: string | null;
  transferDate: string;
  reason: WorkTransfer['reason'];
  notes: string;
  status: WorkTransfer['status'];
}

export interface MutationResult {
  ok: boolean;
  error?: string;
}

export interface DerivedData {
  healthByItem: Map<string, HealthResult>;
  readinessByItem: Map<string, DemoReadinessResult>;
  workloadByMember: Map<string, MemberWorkloadStats>;
  performanceByMember: Map<string, MemberPerformanceStats>;
  demoReadyItemIds: Set<string>;
}

/* ------------------------------------------------------------------ */
/* Context value                                                      */
/* ------------------------------------------------------------------ */

interface StoreContextValue {
  data: AppData;
  derived: DerivedData;

  getMember: (id: string | null | undefined) => TeamMember | undefined;
  getClient: (id: string | null | undefined) => Client | undefined;
  getWorkItem: (id: string | null | undefined) => WorkItem | undefined;

  addTeamMember: (input: Omit<TeamMember, 'id'>) => TeamMember;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  addClient: (input: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addWorkItem: (input: WorkItemInput) => WorkItem;
  updateWorkItem: (id: string, patch: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  deleteAllWorkItems: () => void;

  addTask: (input: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addMeeting: (input: Omit<Meeting, 'id'>) => Meeting;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;

  addRecording: (
    input: Omit<ClientMeetingRecording, 'id' | 'createdAt' | 'updatedAt'>,
  ) => ClientMeetingRecording;
  updateRecording: (
    id: string,
    patch: Partial<ClientMeetingRecording>,
  ) => void;
  deleteRecording: (id: string) => void;

  addFeedback: (input: Omit<Feedback, 'id' | 'createdAt'>) => Feedback;
  updateFeedback: (id: string, patch: Partial<Feedback>) => void;
  deleteFeedback: (id: string) => void;

  addTransfer: (input: TransferInput) => MutationResult;
  updateTransfer: (
    id: string,
    patch: Partial<
      Pick<
        WorkTransfer,
        'reason' | 'notes' | 'transferDate' | 'requestedById' | 'approvedById'
      >
    >,
  ) => void;
  approveTransfer: (id: string, approverId?: string) => void;
  rejectTransfer: (id: string, approverId?: string) => void;
  completeTransfer: (id: string) => void;
  deleteTransfer: (id: string) => void;

  addDemoReadinessItem: (
    input: Omit<DemoReadinessItem, 'id'>,
  ) => DemoReadinessItem;
  updateDemoReadinessItem: (
    id: string,
    patch: Partial<DemoReadinessItem>,
  ) => void;
  deleteDemoReadinessItem: (id: string) => void;

  addTimelineEvent: (
    input: Omit<TimelineEvent, 'id'>,
  ) => TimelineEvent;

  updateWorkflowStage: (
    id: string,
    patch: Partial<Pick<WorkflowStageConfig, 'shortLabel' | 'description'>>,
  ) => void;
  reorderWorkflowStage: (id: string, direction: 'up' | 'down') => void;
  deleteWorkflowStage: (id: string) => void;

  linkRecording: (recordingId: string, workItemId: string) => void;
  unlinkRecording: (recordingId: string, workItemId: string) => void;

  resetMockData: () => void;
  clearAllData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const replace = <T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<NoInfer<T>>,
): T[] => list.map((item) => (item.id === id ? { ...item, ...patch } : item));

function makeTimelineEvent(
  workItemId: string,
  eventType: TimelineEventType,
  title: string,
  description: string,
  actorId: string | null,
  metadata?: TimelineEvent['metadata'],
): TimelineEvent {
  return {
    id: uid('tl'),
    workItemId,
    eventType,
    title,
    description,
    actorId,
    date: nowISO(),
    metadata,
  };
}

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full / unavailable — keep running in-memory */
    }
  }, [data]);

  /* ----------------------------- derived ---------------------------- */
  const derived = useMemo<DerivedData>(() => {
    const ownerActiveCount = new Map<string, number>();
    data.workItems.forEach((w) => {
      if (w.status !== 'Completed') {
        ownerActiveCount.set(
          w.ownerId,
          (ownerActiveCount.get(w.ownerId) ?? 0) + 1,
        );
      }
    });

    const openFeedbackByItem = new Map<string, number>();
    data.feedback.forEach((f) => {
      if (f.workItemId && isBacklogFeedback(f)) {
        openFeedbackByItem.set(
          f.workItemId,
          (openFeedbackByItem.get(f.workItemId) ?? 0) + 1,
        );
      }
    });

    const clientById = new Map(data.clients.map((c) => [c.id, c]));

    const healthByItem = new Map<string, HealthResult>();
    data.workItems.forEach((w) => {
      healthByItem.set(
        w.id,
        computeHealth(w, {
          openFeedbackCount: openFeedbackByItem.get(w.id) ?? 0,
          ownerActiveCount: ownerActiveCount.get(w.ownerId) ?? 0,
          client: clientById.get(w.clientId),
        }),
      );
    });

    const readinessGroups = groupBy(
      data.demoReadinessItems,
      (d) => d.workItemId,
    );
    const readinessByItem = new Map<string, DemoReadinessResult>();
    data.workItems.forEach((w) => {
      readinessByItem.set(
        w.id,
        computeDemoReadiness(readinessGroups.get(w.id) ?? []),
      );
    });

    const demoReadyItemIds = new Set<string>();
    readinessByItem.forEach((r, id) => {
      if (r.badge === 'Demo Ready') demoReadyItemIds.add(id);
    });

    const healthPointsByItem = new Map<string, number>();
    healthByItem.forEach((h, id) => healthPointsByItem.set(id, h.points));

    const workloadByMember = new Map<string, MemberWorkloadStats>();
    const performanceByMember = new Map<string, MemberPerformanceStats>();
    data.teamMembers.forEach((m) => {
      workloadByMember.set(m.id, computeMemberWorkload(m, data));
      performanceByMember.set(
        m.id,
        computeMemberPerformance(
          m,
          data,
          healthPointsByItem,
          demoReadyItemIds,
        ),
      );
    });

    return {
      healthByItem,
      readinessByItem,
      workloadByMember,
      performanceByMember,
      demoReadyItemIds,
    };
  }, [data]);

  /* ----------------------------- resolvers -------------------------- */
  const getMember = useCallback(
    (id: string | null | undefined) =>
      id ? data.teamMembers.find((m) => m.id === id) : undefined,
    [data.teamMembers],
  );
  const getClient = useCallback(
    (id: string | null | undefined) =>
      id ? data.clients.find((c) => c.id === id) : undefined,
    [data.clients],
  );
  const getWorkItem = useCallback(
    (id: string | null | undefined) =>
      id ? data.workItems.find((w) => w.id === id) : undefined,
    [data.workItems],
  );

  /* ----------------------------- team ------------------------------- */
  const addTeamMember = useCallback(
    (input: Omit<TeamMember, 'id'>) => {
      const member: TeamMember = { ...input, id: uid('tm') };
      setData((d) => ({ ...d, teamMembers: [...d.teamMembers, member] }));
      return member;
    },
    [],
  );
  const updateTeamMember = useCallback(
    (id: string, patch: Partial<TeamMember>) => {
      setData((d) => ({
        ...d,
        teamMembers: replace(d.teamMembers, id, patch),
      }));
    },
    [],
  );
  const deleteTeamMember = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      teamMembers: d.teamMembers.filter((m) => m.id !== id),
      // keep reporting lines intact for anyone who reported to this member
      // by detaching them gracefully
      // (handled in views via getMember returning undefined)
    }));
  }, []);

  /* ----------------------------- clients ---------------------------- */
  const addClient = useCallback((input: Omit<Client, 'id'>) => {
    const client: Client = { ...input, id: uid('cl') };
    setData((d) => ({ ...d, clients: [...d.clients, client] }));
    return client;
  }, []);
  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setData((d) => ({ ...d, clients: replace(d.clients, id, patch) }));
  }, []);
  const deleteClient = useCallback((id: string) => {
    setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
  }, []);

  /* ----------------------------- work items ------------------------- */
  const addWorkItem = useCallback((input: WorkItemInput) => {
    const id = uid('wi');
    const now = nowISO();
    const workItem: WorkItem = {
      ...input,
      id,
      originalOwnerId: input.ownerId,
      previousOwnerIds: [],
      transferHistoryIds: [],
      linkedMeetingRecordingIds: [],
      hasPendingTransfer: false,
      improvementCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const readiness: DemoReadinessItem[] = DEFAULT_READINESS_LABELS.map(
      (label) => ({
        id: uid('dr'),
        workItemId: id,
        label,
        status:
          label === 'Agent integration done / not required' &&
          !input.agentIntegrationRequired
            ? 'Not Required'
            : 'Pending',
        ownerId: input.ownerId,
        notes: '',
      }),
    );
    const created = makeTimelineEvent(
      id,
      'created',
      'Work item created',
      `${workItem.title} (${workItem.type}) added to the tracker.`,
      workItem.ownerId,
    );
    setData((d) => ({
      ...d,
      workItems: [...d.workItems, workItem],
      demoReadinessItems: [...d.demoReadinessItems, ...readiness],
      timelineEvents: [...d.timelineEvents, created],
    }));
    return workItem;
  }, []);

  const updateWorkItem = useCallback(
    (id: string, patch: Partial<WorkItem>) => {
      setData((d) => {
        const existing = d.workItems.find((w) => w.id === id);
        if (!existing) return d;

        const next: WorkItem = {
          ...existing,
          ...patch,
          updatedAt: nowISO(),
        };

        // auto-set completion date
        if (
          next.status === 'Completed' &&
          existing.status !== 'Completed' &&
          !next.completionDate
        ) {
          next.completionDate = todayISO();
        }
        if (next.status !== 'Completed') {
          next.completionDate = patch.completionDate ?? next.completionDate;
        }

        const events: TimelineEvent[] = [];
        if (patch.currentStage && patch.currentStage !== existing.currentStage) {
          events.push(
            makeTimelineEvent(
              id,
              patch.currentStage === 'Live on Munshot'
                ? 'went_live'
                : patch.currentStage === 'Final Completion'
                  ? 'completed'
                  : 'stage_change',
              `Stage moved to: ${patch.currentStage}`,
              `Workflow stage updated from "${existing.currentStage}".`,
              next.ownerId,
              { stage: patch.currentStage },
            ),
          );
        }
        if (patch.status && patch.status !== existing.status) {
          if (patch.status === 'Completed') {
            events.push(
              makeTimelineEvent(
                id,
                'completed',
                'Work item completed',
                `${next.title} marked as completed.`,
                next.ownerId,
              ),
            );
          } else if (patch.status === 'Live') {
            events.push(
              makeTimelineEvent(
                id,
                'went_live',
                'Went live on Munshot',
                `${next.title} is now live.`,
                next.ownerId,
              ),
            );
          } else {
            events.push(
              makeTimelineEvent(
                id,
                'status_change',
                `Status changed to ${patch.status}`,
                `Status updated from "${existing.status}".`,
                next.ownerId,
              ),
            );
          }
        }

        // Assignment — owner moved from unassigned to a real member.
        if (!existing.ownerId && patch.ownerId) {
          if (!next.originalOwnerId) {
            next.originalOwnerId = patch.ownerId;
          }
          const ownerName =
            d.teamMembers.find((m) => m.id === patch.ownerId)?.name ??
            'a team member';
          events.push(
            makeTimelineEvent(
              id,
              'assigned',
              `Assigned to ${ownerName}`,
              `${next.title} was assigned an owner.`,
              patch.ownerId,
            ),
          );
        }

        return {
          ...d,
          workItems: d.workItems.map((w) => (w.id === id ? next : w)),
          timelineEvents: [...d.timelineEvents, ...events],
        };
      });
    },
    [],
  );

  const deleteWorkItem = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      workItems: d.workItems.filter((w) => w.id !== id),
      tasks: d.tasks.filter((t) => t.workItemId !== id),
      feedback: d.feedback.filter((f) => f.workItemId !== id),
      transfers: d.transfers.filter((t) => t.workItemId !== id),
      timelineEvents: d.timelineEvents.filter((e) => e.workItemId !== id),
      demoReadinessItems: d.demoReadinessItems.filter(
        (r) => r.workItemId !== id,
      ),
      recordings: d.recordings.map((r) =>
        r.linkedWorkItemIds.includes(id)
          ? {
              ...r,
              linkedWorkItemIds: r.linkedWorkItemIds.filter((w) => w !== id),
            }
          : r,
      ),
    }));
  }, []);

  const deleteAllWorkItems = useCallback(() => {
    setData((d) => ({
      ...d,
      workItems: [],
      tasks: d.tasks.filter((t) => !t.workItemId),
      feedback: [],
      transfers: [],
      timelineEvents: [],
      demoReadinessItems: [],
      recordings: d.recordings.map((r) =>
        r.linkedWorkItemIds.length
          ? { ...r, linkedWorkItemIds: [] }
          : r,
      ),
    }));
  }, []);

  /* ----------------------------- tasks ------------------------------ */
  const addTask = useCallback((input: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = { ...input, id: uid('task'), createdAt: nowISO() };
    setData((d) => {
      const events: TimelineEvent[] = task.workItemId
        ? [
            makeTimelineEvent(
              task.workItemId,
              'task_added',
              `Task added: ${task.title}`,
              task.description || `New task created.`,
              task.ownerId,
            ),
          ]
        : [];
      return {
        ...d,
        tasks: [...d.tasks, task],
        timelineEvents: [...d.timelineEvents, ...events],
      };
    });
    return task;
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({ ...d, tasks: replace(d.tasks, id, patch) }));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  /* ----------------------------- meetings --------------------------- */
  const addMeeting = useCallback((input: Omit<Meeting, 'id'>) => {
    const meeting: Meeting = { ...input, id: uid('mt') };
    setData((d) => ({ ...d, meetings: [...d.meetings, meeting] }));
    return meeting;
  }, []);
  const updateMeeting = useCallback((id: string, patch: Partial<Meeting>) => {
    setData((d) => ({ ...d, meetings: replace(d.meetings, id, patch) }));
  }, []);
  const deleteMeeting = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      meetings: d.meetings.filter((m) => m.id !== id),
    }));
  }, []);

  /* ----------------------------- recordings ------------------------- */
  const addRecording = useCallback(
    (input: Omit<ClientMeetingRecording, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = nowISO();
      const recording: ClientMeetingRecording = {
        ...input,
        id: uid('rec'),
        createdAt: now,
        updatedAt: now,
      };
      setData((d) => {
        const events = recording.linkedWorkItemIds.map((wiId) =>
          makeTimelineEvent(
            wiId,
            'recording_linked',
            `Client meeting recording added: ${recording.title}`,
            recording.notes || 'Recording linked to this work item.',
            recording.ownerId,
            { recordingId: recording.id },
          ),
        );
        return {
          ...d,
          recordings: [...d.recordings, recording],
          workItems: d.workItems.map((w) =>
            recording.linkedWorkItemIds.includes(w.id)
              ? {
                  ...w,
                  linkedMeetingRecordingIds: [
                    ...w.linkedMeetingRecordingIds,
                    recording.id,
                  ],
                  updatedAt: now,
                }
              : w,
          ),
          timelineEvents: [...d.timelineEvents, ...events],
        };
      });
      return recording;
    },
    [],
  );

  const updateRecording = useCallback(
    (id: string, patch: Partial<ClientMeetingRecording>) => {
      setData((d) => {
        const existing = d.recordings.find((r) => r.id === id);
        if (!existing) return d;
        const next: ClientMeetingRecording = {
          ...existing,
          ...patch,
          updatedAt: nowISO(),
        };
        const prevLinks = new Set(existing.linkedWorkItemIds);
        const nextLinks = new Set(next.linkedWorkItemIds);
        const addedLinks = next.linkedWorkItemIds.filter(
          (w) => !prevLinks.has(w),
        );
        const events = addedLinks.map((wiId) =>
          makeTimelineEvent(
            wiId,
            'recording_linked',
            `Client meeting recording added: ${next.title}`,
            next.notes || 'Recording linked to this work item.',
            next.ownerId,
            { recordingId: next.id },
          ),
        );
        return {
          ...d,
          recordings: d.recordings.map((r) => (r.id === id ? next : r)),
          workItems: d.workItems.map((w) => {
            const shouldHave = nextLinks.has(w.id);
            const has = w.linkedMeetingRecordingIds.includes(id);
            if (shouldHave && !has) {
              return {
                ...w,
                linkedMeetingRecordingIds: [
                  ...w.linkedMeetingRecordingIds,
                  id,
                ],
              };
            }
            if (!shouldHave && has) {
              return {
                ...w,
                linkedMeetingRecordingIds:
                  w.linkedMeetingRecordingIds.filter((r) => r !== id),
              };
            }
            return w;
          }),
          timelineEvents: [...d.timelineEvents, ...events],
        };
      });
    },
    [],
  );

  const deleteRecording = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      recordings: d.recordings.filter((r) => r.id !== id),
      workItems: d.workItems.map((w) =>
        w.linkedMeetingRecordingIds.includes(id)
          ? {
              ...w,
              linkedMeetingRecordingIds:
                w.linkedMeetingRecordingIds.filter((r) => r !== id),
            }
          : w,
      ),
      timelineEvents: d.timelineEvents.filter(
        (e) => e.metadata?.recordingId !== id,
      ),
    }));
  }, []);

  const linkRecording = useCallback(
    (recordingId: string, workItemId: string) => {
      setData((d) => {
        const recording = d.recordings.find((r) => r.id === recordingId);
        if (!recording || recording.linkedWorkItemIds.includes(workItemId)) {
          return d;
        }
        const event = makeTimelineEvent(
          workItemId,
          'recording_linked',
          `Client meeting recording added: ${recording.title}`,
          recording.notes || 'Recording linked to this work item.',
          recording.ownerId,
          { recordingId },
        );
        return {
          ...d,
          recordings: d.recordings.map((r) =>
            r.id === recordingId
              ? {
                  ...r,
                  linkedWorkItemIds: [...r.linkedWorkItemIds, workItemId],
                  updatedAt: nowISO(),
                }
              : r,
          ),
          workItems: d.workItems.map((w) =>
            w.id === workItemId
              ? {
                  ...w,
                  linkedMeetingRecordingIds: [
                    ...w.linkedMeetingRecordingIds,
                    recordingId,
                  ],
                }
              : w,
          ),
          timelineEvents: [...d.timelineEvents, event],
        };
      });
    },
    [],
  );

  const unlinkRecording = useCallback(
    (recordingId: string, workItemId: string) => {
      setData((d) => ({
        ...d,
        recordings: d.recordings.map((r) =>
          r.id === recordingId
            ? {
                ...r,
                linkedWorkItemIds: r.linkedWorkItemIds.filter(
                  (w) => w !== workItemId,
                ),
                updatedAt: nowISO(),
              }
            : r,
        ),
        workItems: d.workItems.map((w) =>
          w.id === workItemId
            ? {
                ...w,
                linkedMeetingRecordingIds:
                  w.linkedMeetingRecordingIds.filter(
                    (r) => r !== recordingId,
                  ),
              }
            : w,
        ),
      }));
    },
    [],
  );

  /* ----------------------------- feedback --------------------------- */
  const recountImprovements = (
    items: WorkItem[],
    feedback: Feedback[],
    workItemId: string | null,
  ): WorkItem[] => {
    if (!workItemId) return items;
    const count = feedback.filter((f) => f.workItemId === workItemId).length;
    return items.map((w) =>
      w.id === workItemId ? { ...w, improvementCount: count } : w,
    );
  };

  const addFeedback = useCallback(
    (input: Omit<Feedback, 'id' | 'createdAt'>) => {
      const feedback: Feedback = {
        ...input,
        id: uid('fb'),
        createdAt: nowISO(),
      };
      setData((d) => {
        const nextFeedback = [...d.feedback, feedback];
        const events = feedback.workItemId
          ? [
              makeTimelineEvent(
                feedback.workItemId,
                'feedback_added',
                `Feedback logged (${feedback.source})`,
                feedback.feedbackText,
                null,
                { feedbackId: feedback.id, priority: feedback.priority },
              ),
            ]
          : [];
        return {
          ...d,
          feedback: nextFeedback,
          workItems: recountImprovements(
            d.workItems,
            nextFeedback,
            feedback.workItemId,
          ),
          timelineEvents: [...d.timelineEvents, ...events],
        };
      });
      return feedback;
    },
    [],
  );

  const updateFeedback = useCallback(
    (id: string, patch: Partial<Feedback>) => {
      setData((d) => {
        const nextFeedback = replace(d.feedback, id, patch);
        const target = nextFeedback.find((f) => f.id === id);
        return {
          ...d,
          feedback: nextFeedback,
          workItems: recountImprovements(
            d.workItems,
            nextFeedback,
            target?.workItemId ?? null,
          ),
        };
      });
    },
    [],
  );

  const deleteFeedback = useCallback((id: string) => {
    setData((d) => {
      const target = d.feedback.find((f) => f.id === id);
      const nextFeedback = d.feedback.filter((f) => f.id !== id);
      return {
        ...d,
        feedback: nextFeedback,
        workItems: recountImprovements(
          d.workItems,
          nextFeedback,
          target?.workItemId ?? null,
        ),
      };
    });
  }, []);

  /* ----------------------------- transfers -------------------------- */
  const addTransfer = useCallback((input: TransferInput): MutationResult => {
    if (input.fromOwnerId === input.toOwnerId) {
      return { ok: false, error: 'Cannot transfer work to the same owner.' };
    }
    let result: MutationResult = { ok: true };
    setData((d) => {
      const workItem = d.workItems.find((w) => w.id === input.workItemId);
      if (!workItem) {
        result = { ok: false, error: 'Work item not found.' };
        return d;
      }
      const hasPending = d.transfers.some(
        (t) => t.workItemId === input.workItemId && t.status === 'Pending',
      );
      if (input.status === 'Pending' && hasPending) {
        result = {
          ok: false,
          error: 'This work item already has a pending transfer.',
        };
        return d;
      }

      const now = nowISO();
      const transfer: WorkTransfer = {
        ...input,
        id: uid('wt'),
        createdAt: now,
        updatedAt: now,
      };

      const events: TimelineEvent[] = [
        makeTimelineEvent(
          workItem.id,
          'transfer_requested',
          'Work transfer requested',
          `${transfer.reason}: proposed ownership change. ${transfer.notes}`.trim(),
          transfer.requestedById,
          { transferId: transfer.id, status: transfer.status },
        ),
      ];

      const ownershipMoves =
        transfer.status === 'Approved' || transfer.status === 'Completed';

      const nextWorkItems = d.workItems.map((w) => {
        if (w.id !== workItem.id) return w;
        const transferHistoryIds = [...w.transferHistoryIds, transfer.id];
        if (ownershipMoves) {
          const previousOwnerIds =
            w.ownerId !== transfer.toOwnerId &&
            !w.previousOwnerIds.includes(w.ownerId)
              ? [...w.previousOwnerIds, w.ownerId]
              : w.previousOwnerIds;
          return {
            ...w,
            ownerId: transfer.toOwnerId,
            previousOwnerIds,
            transferHistoryIds,
            hasPendingTransfer: false,
            updatedAt: now,
          };
        }
        return {
          ...w,
          transferHistoryIds,
          hasPendingTransfer:
            transfer.status === 'Pending' ? true : w.hasPendingTransfer,
          updatedAt: now,
        };
      });

      if (ownershipMoves) {
        events.push(
          makeTimelineEvent(
            workItem.id,
            transfer.status === 'Completed'
              ? 'transfer_completed'
              : 'transfer_approved',
            `Work transfer ${transfer.status.toLowerCase()}`,
            `Ownership moved as part of: ${transfer.reason}.`,
            transfer.approvedById,
            { transferId: transfer.id },
          ),
        );
      }

      return {
        ...d,
        transfers: [...d.transfers, transfer],
        workItems: nextWorkItems,
        timelineEvents: [...d.timelineEvents, ...events],
      };
    });
    return result;
  }, []);

  const updateTransfer = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          WorkTransfer,
          | 'reason'
          | 'notes'
          | 'transferDate'
          | 'requestedById'
          | 'approvedById'
        >
      >,
    ) => {
      setData((d) => ({
        ...d,
        transfers: replace(d.transfers, id, { ...patch, updatedAt: nowISO() }),
      }));
    },
    [],
  );

  const resolveTransferLifecycle = useCallback(
    (id: string, nextStatus: WorkTransfer['status'], approverId?: string) => {
      setData((d) => {
        const transfer = d.transfers.find((t) => t.id === id);
        if (!transfer) return d;
        const now = nowISO();
        const ownershipWasMoved =
          transfer.status === 'Approved' || transfer.status === 'Completed';
        const ownershipShouldMove =
          nextStatus === 'Approved' || nextStatus === 'Completed';

        const updatedTransfer: WorkTransfer = {
          ...transfer,
          status: nextStatus,
          approvedById:
            approverId ?? transfer.approvedById ?? null,
          updatedAt: now,
        };

        const events: TimelineEvent[] = [];
        let nextWorkItems = d.workItems;

        if (ownershipShouldMove && !ownershipWasMoved) {
          nextWorkItems = d.workItems.map((w) => {
            if (w.id !== transfer.workItemId) return w;
            const previousOwnerIds =
              w.ownerId !== transfer.toOwnerId &&
              !w.previousOwnerIds.includes(w.ownerId)
                ? [...w.previousOwnerIds, w.ownerId]
                : w.previousOwnerIds;
            return {
              ...w,
              ownerId: transfer.toOwnerId,
              previousOwnerIds,
              hasPendingTransfer: false,
              updatedAt: now,
            };
          });
          events.push(
            makeTimelineEvent(
              transfer.workItemId,
              nextStatus === 'Completed'
                ? 'transfer_completed'
                : 'transfer_approved',
              `Work transfer ${nextStatus.toLowerCase()}`,
              `Ownership moved as part of: ${transfer.reason}.`,
              updatedTransfer.approvedById,
              { transferId: transfer.id },
            ),
          );
        } else if (nextStatus === 'Completed' && ownershipWasMoved) {
          events.push(
            makeTimelineEvent(
              transfer.workItemId,
              'transfer_completed',
              'Work transfer completed',
              `Transfer finalised: ${transfer.reason}.`,
              updatedTransfer.approvedById,
              { transferId: transfer.id },
            ),
          );
        } else if (nextStatus === 'Rejected') {
          nextWorkItems = d.workItems.map((w) =>
            w.id === transfer.workItemId
              ? {
                  ...w,
                  hasPendingTransfer: d.transfers.some(
                    (t) =>
                      t.workItemId === w.id &&
                      t.id !== id &&
                      t.status === 'Pending',
                  ),
                  updatedAt: now,
                }
              : w,
          );
          events.push(
            makeTimelineEvent(
              transfer.workItemId,
              'transfer_rejected',
              'Work transfer rejected',
              transfer.notes || `Transfer request rejected.`,
              updatedTransfer.approvedById,
              { transferId: transfer.id },
            ),
          );
        }

        return {
          ...d,
          transfers: d.transfers.map((t) =>
            t.id === id ? updatedTransfer : t,
          ),
          workItems: nextWorkItems,
          timelineEvents: [...d.timelineEvents, ...events],
        };
      });
    },
    [],
  );

  const approveTransfer = useCallback(
    (id: string, approverId?: string) => {
      const lead = data.teamMembers.find(
        (m) => m.role === 'Team Lead - Intern',
      );
      resolveTransferLifecycle(id, 'Approved', approverId ?? lead?.id);
    },
    [data.teamMembers, resolveTransferLifecycle],
  );
  const rejectTransfer = useCallback(
    (id: string, approverId?: string) => {
      const lead = data.teamMembers.find(
        (m) => m.role === 'Team Lead - Intern',
      );
      resolveTransferLifecycle(id, 'Rejected', approverId ?? lead?.id);
    },
    [data.teamMembers, resolveTransferLifecycle],
  );
  const completeTransfer = useCallback(
    (id: string) => resolveTransferLifecycle(id, 'Completed'),
    [resolveTransferLifecycle],
  );

  const deleteTransfer = useCallback((id: string) => {
    setData((d) => {
      const transfer = d.transfers.find((t) => t.id === id);
      const remaining = d.transfers.filter((t) => t.id !== id);
      return {
        ...d,
        transfers: remaining,
        workItems: transfer
          ? d.workItems.map((w) =>
              w.id === transfer.workItemId
                ? {
                    ...w,
                    transferHistoryIds: w.transferHistoryIds.filter(
                      (t) => t !== id,
                    ),
                    hasPendingTransfer: remaining.some(
                      (t) =>
                        t.workItemId === w.id && t.status === 'Pending',
                    ),
                  }
                : w,
            )
          : d.workItems,
        timelineEvents: d.timelineEvents.filter(
          (e) => e.metadata?.transferId !== id,
        ),
      };
    });
  }, []);

  /* ----------------------------- demo readiness --------------------- */
  const addDemoReadinessItem = useCallback(
    (input: Omit<DemoReadinessItem, 'id'>) => {
      const item: DemoReadinessItem = { ...input, id: uid('dr') };
      setData((d) => ({
        ...d,
        demoReadinessItems: [...d.demoReadinessItems, item],
      }));
      return item;
    },
    [],
  );
  const updateDemoReadinessItem = useCallback(
    (id: string, patch: Partial<DemoReadinessItem>) => {
      setData((d) => ({
        ...d,
        demoReadinessItems: replace(d.demoReadinessItems, id, patch),
      }));
    },
    [],
  );
  const deleteDemoReadinessItem = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      demoReadinessItems: d.demoReadinessItems.filter((r) => r.id !== id),
    }));
  }, []);

  /* ----------------------------- timeline --------------------------- */
  const addTimelineEvent = useCallback(
    (input: Omit<TimelineEvent, 'id'>) => {
      const event: TimelineEvent = { ...input, id: uid('tl') };
      setData((d) => ({
        ...d,
        timelineEvents: [...d.timelineEvents, event],
      }));
      return event;
    },
    [],
  );

  /* ----------------------------- workflow stages -------------------- */
  const updateWorkflowStage = useCallback(
    (
      id: string,
      patch: Partial<Pick<WorkflowStageConfig, 'shortLabel' | 'description'>>,
    ) => {
      setData((d) => ({
        ...d,
        workflowStages: replace(d.workflowStages, id, patch),
      }));
    },
    [],
  );

  const reorderWorkflowStage = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setData((d) => {
        const sorted = [...d.workflowStages].sort(
          (a, b) => a.order - b.order,
        );
        const index = sorted.findIndex((s) => s.id === id);
        if (index === -1) return d;
        const swapWith = direction === 'up' ? index - 1 : index + 1;
        if (swapWith < 0 || swapWith >= sorted.length) return d;
        const a = sorted[index];
        const b = sorted[swapWith];
        const swappedOrder = a.order;
        return {
          ...d,
          workflowStages: d.workflowStages.map((s) => {
            if (s.id === a.id) return { ...s, order: b.order };
            if (s.id === b.id) return { ...s, order: swappedOrder };
            return s;
          }),
        };
      });
    },
    [],
  );

  const deleteWorkflowStage = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      workflowStages: d.workflowStages.filter((s) => s.id !== id),
    }));
  }, []);

  /* ----------------------------- global ----------------------------- */
  const resetMockData = useCallback(() => {
    setData(cloneSeedData());
  }, []);
  const clearAllData = useCallback(() => {
    setData(emptyData());
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      derived,
      getMember,
      getClient,
      getWorkItem,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addClient,
      updateClient,
      deleteClient,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      deleteAllWorkItems,
      addTask,
      updateTask,
      deleteTask,
      addMeeting,
      updateMeeting,
      deleteMeeting,
      addRecording,
      updateRecording,
      deleteRecording,
      addFeedback,
      updateFeedback,
      deleteFeedback,
      addTransfer,
      updateTransfer,
      approveTransfer,
      rejectTransfer,
      completeTransfer,
      deleteTransfer,
      addDemoReadinessItem,
      updateDemoReadinessItem,
      deleteDemoReadinessItem,
      addTimelineEvent,
      updateWorkflowStage,
      reorderWorkflowStage,
      deleteWorkflowStage,
      linkRecording,
      unlinkRecording,
      resetMockData,
      clearAllData,
    }),
    [
      data,
      derived,
      getMember,
      getClient,
      getWorkItem,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addClient,
      updateClient,
      deleteClient,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      deleteAllWorkItems,
      addTask,
      updateTask,
      deleteTask,
      addMeeting,
      updateMeeting,
      deleteMeeting,
      addRecording,
      updateRecording,
      deleteRecording,
      addFeedback,
      updateFeedback,
      deleteFeedback,
      addTransfer,
      updateTransfer,
      approveTransfer,
      rejectTransfer,
      completeTransfer,
      deleteTransfer,
      addDemoReadinessItem,
      updateDemoReadinessItem,
      deleteDemoReadinessItem,
      addTimelineEvent,
      updateWorkflowStage,
      reorderWorkflowStage,
      deleteWorkflowStage,
      linkRecording,
      unlinkRecording,
      resetMockData,
      clearAllData,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
