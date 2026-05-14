/**
 * UI orchestration layer.
 * Renders every form modal + the work-item / recording detail drawers once,
 * and exposes imperative openers so any component can trigger them without
 * managing modal state locally.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Client,
  ClientMeetingRecording,
  Feedback,
  Meeting,
  Task,
  TeamMember,
  WorkItem,
  WorkTransfer,
} from '@/types';
import type { TransferInput, WorkItemInput } from '@/store/StoreContext';
import { WorkItemModal } from '@/components/forms/WorkItemModal';
import { TeamMemberModal } from '@/components/forms/TeamMemberModal';
import { ClientModal } from '@/components/forms/ClientModal';
import { TaskModal } from '@/components/forms/TaskModal';
import { MeetingModal } from '@/components/forms/MeetingModal';
import { ClientMeetingRecordingModal } from '@/components/forms/ClientMeetingRecordingModal';
import { FeedbackModal } from '@/components/forms/FeedbackModal';
import { WorkTransferModal } from '@/components/forms/WorkTransferModal';
import { WorkItemDetailDrawer } from '@/components/WorkItemDetailDrawer';
import { RecordingDetailDrawer } from '@/components/RecordingDetailDrawer';

type FormKind =
  | 'workItem'
  | 'member'
  | 'client'
  | 'task'
  | 'meeting'
  | 'recording'
  | 'feedback'
  | 'transfer';

interface FormState {
  kind: FormKind;
  editing?: any;
  prefill?: any;
}

interface UIContextValue {
  openWorkItem: (id: string) => void;
  closeWorkItem: () => void;
  openRecording: (id: string) => void;
  closeRecording: () => void;

  addWorkItem: (prefill?: Partial<WorkItemInput>) => void;
  editWorkItem: (workItem: WorkItem) => void;

  addTeamMember: (prefill?: Partial<Omit<TeamMember, 'id'>>) => void;
  editTeamMember: (member: TeamMember) => void;

  addClient: (prefill?: Partial<Omit<Client, 'id'>>) => void;
  editClient: (client: Client) => void;

  addTask: (prefill?: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  editTask: (task: Task) => void;

  addMeeting: (prefill?: Partial<Omit<Meeting, 'id'>>) => void;
  editMeeting: (meeting: Meeting) => void;

  addRecording: (
    prefill?: Partial<
      Omit<ClientMeetingRecording, 'id' | 'createdAt' | 'updatedAt'>
    >,
  ) => void;
  editRecording: (recording: ClientMeetingRecording) => void;

  addFeedback: (prefill?: Partial<Omit<Feedback, 'id' | 'createdAt'>>) => void;
  editFeedback: (feedback: Feedback) => void;

  addTransfer: (prefill?: Partial<TransferInput>) => void;
  editTransfer: (transfer: WorkTransfer) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState | null>(null);
  const [workItemDrawerId, setWorkItemDrawerId] = useState<string | null>(
    null,
  );
  const [recordingDrawerId, setRecordingDrawerId] = useState<string | null>(
    null,
  );

  const closeForm = useCallback(() => setForm(null), []);

  const value = useMemo<UIContextValue>(() => {
    const add = (kind: FormKind) => (prefill?: unknown) =>
      setForm({ kind, prefill });
    const edit = (kind: FormKind) => (editing: unknown) =>
      setForm({ kind, editing });
    return {
      openWorkItem: (id) => {
        setRecordingDrawerId(null);
        setWorkItemDrawerId(id);
      },
      closeWorkItem: () => setWorkItemDrawerId(null),
      openRecording: (id) => {
        setWorkItemDrawerId(null);
        setRecordingDrawerId(id);
      },
      closeRecording: () => setRecordingDrawerId(null),

      addWorkItem: add('workItem'),
      editWorkItem: edit('workItem'),
      addTeamMember: add('member'),
      editTeamMember: edit('member'),
      addClient: add('client'),
      editClient: edit('client'),
      addTask: add('task'),
      editTask: edit('task'),
      addMeeting: add('meeting'),
      editMeeting: edit('meeting'),
      addRecording: add('recording'),
      editRecording: edit('recording'),
      addFeedback: add('feedback'),
      editFeedback: edit('feedback'),
      addTransfer: add('transfer'),
      editTransfer: edit('transfer'),
    };
  }, []);

  const propsFor = (kind: FormKind) => ({
    open: form?.kind === kind,
    onClose: closeForm,
    editing: form?.kind === kind ? form.editing : undefined,
    prefill: form?.kind === kind ? form.prefill : undefined,
  });

  return (
    <UIContext.Provider value={value}>
      {children}

      <WorkItemModal {...propsFor('workItem')} />
      <TeamMemberModal {...propsFor('member')} />
      <ClientModal {...propsFor('client')} />
      <TaskModal {...propsFor('task')} />
      <MeetingModal {...propsFor('meeting')} />
      <ClientMeetingRecordingModal {...propsFor('recording')} />
      <FeedbackModal {...propsFor('feedback')} />
      <WorkTransferModal {...propsFor('transfer')} />

      <WorkItemDetailDrawer
        workItemId={workItemDrawerId}
        onClose={() => setWorkItemDrawerId(null)}
      />
      <RecordingDetailDrawer
        recordingId={recordingDrawerId}
        onClose={() => setRecordingDrawerId(null)}
      />
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
