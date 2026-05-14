import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { PRIORITIES, TASK_STATUSES, type Task } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  DateInput,
  Field,
  Select,
  TextArea,
  TextInput,
  toOptions,
} from '@/components/ui/Field';
import { todayISO } from '@/utils/dates';

type Draft = Omit<Task, 'id' | 'createdAt'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Task;
  prefill?: Partial<Draft>;
}

const emptyDraft = (prefill?: Partial<Draft>): Draft => ({
  workItemId: null,
  ownerId: '',
  clientId: null,
  title: '',
  description: '',
  status: 'To Do',
  priority: 'Medium',
  dueDate: todayISO(),
  ...prefill,
});

export function TaskModal({ open, onClose, editing, prefill }: Props) {
  const { addTask, updateTask, data } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(prefill));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDraft(editing ? { ...editing } : emptyDraft(prefill));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onWorkItemChange = (id: string) => {
    const wi = data.workItems.find((w) => w.id === id);
    set({
      workItemId: id || null,
      ...(wi ? { clientId: wi.clientId, ownerId: draft.ownerId || wi.ownerId } : {}),
    });
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Task title is required';
    if (!draft.ownerId) errs.ownerId = 'An owner is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateTask(editing.id, draft);
      toast.success('Task updated', draft.title);
    } else {
      addTask(draft);
      toast.success('Task added', draft.title);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CheckSquare}
      title={editing ? 'Edit Task' : 'Add Task / Todo'}
      subtitle="Track granular work under a deliverable"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add task'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Task title" required error={errors.title}>
          <TextInput
            value={draft.title}
            invalid={!!errors.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Wire up the data layer"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Linked work item">
            <Select
              value={draft.workItemId ?? ''}
              onChange={onWorkItemChange}
              options={data.workItems.map((w) => ({
                value: w.id,
                label: w.title,
              }))}
              placeholder="Standalone task"
            />
          </Field>
          <Field label="Owner" required error={errors.ownerId}>
            <Select
              value={draft.ownerId}
              onChange={(v) => set({ ownerId: v })}
              options={data.teamMembers.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              placeholder="Select owner"
              invalid={!!errors.ownerId}
            />
          </Field>
          <Field label="Client">
            <Select
              value={draft.clientId ?? ''}
              onChange={(v) => set({ clientId: v || null })}
              options={data.clients.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="No client"
            />
          </Field>
          <Field label="Due date">
            <DateInput
              value={draft.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v as Task['status'] })}
              options={toOptions(TASK_STATUSES)}
            />
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(v) => set({ priority: v as Task['priority'] })}
              options={toOptions(PRIORITIES)}
            />
          </Field>
        </div>

        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Optional detail…"
          />
        </Field>
      </div>
    </Modal>
  );
}
