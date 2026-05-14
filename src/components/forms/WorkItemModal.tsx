import { useEffect, useState } from 'react';
import { ListChecks, Plus, X } from 'lucide-react';
import {
  APPROVAL_STATUSES,
  CLIENT_FEEDBACK_STATUSES,
  PRIORITIES,
  REVIEW_STATUSES,
  STEP_STATUSES,
  WORKFLOW_STAGES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
  type WorkItem,
  type WorkLink,
} from '@/types';
import { useStore, type WorkItemInput } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  DateInput,
  Field,
  Select,
  TextArea,
  TextInput,
  Toggle,
  toOptions,
} from '@/components/ui/Field';
import { todayISO } from '@/utils/dates';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: WorkItem;
  prefill?: Partial<WorkItemInput>;
}

function LinksEditor({
  value,
  onChange,
}: {
  value: WorkLink[];
  onChange: (links: WorkLink[]) => void;
}) {
  return (
    <div className="space-y-2">
      {value.map((link, i) => (
        <div key={i} className="flex gap-2">
          <TextInput
            placeholder="Label"
            value={link.label}
            className="w-1/3"
            onChange={(e) =>
              onChange(
                value.map((l, idx) =>
                  idx === i ? { ...l, label: e.target.value } : l,
                ),
              )
            }
          />
          <TextInput
            placeholder="https://…"
            value={link.url}
            onChange={(e) =>
              onChange(
                value.map((l, idx) =>
                  idx === i ? { ...l, url: e.target.value } : l,
                ),
              )
            }
          />
          <button
            type="button"
            className="btn-ghost shrink-0 px-3"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label="Remove link"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        onClick={() => onChange([...value, { label: '', url: '' }])}
      >
        <Plus className="h-3.5 w-3.5" />
        Add link
      </button>
    </div>
  );
}

export function WorkItemModal({ open, onClose, editing, prefill }: Props) {
  const { addWorkItem, updateWorkItem, data } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<WorkItemInput>(() => emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function emptyDraft(): WorkItemInput {
    return {
      title: '',
      type: 'Dashboard',
      clientId: data.clients[0]?.id ?? '',
      ownerId: '',
      priority: 'Medium',
      currentStage: 'Client Meeting',
      status: 'Not Started',
      startDate: todayISO(),
      dueDate: todayISO(),
      completionDate: null,
      progress: 0,
      description: '',
      chatgptPromptStatus: 'Not Started',
      claudeBuildStatus: 'Not Started',
      agentIntegrationRequired: false,
      agentIntegrationStatus: 'Not Required',
      vipulApprovalStatus: 'Pending',
      chiraagReviewStatus: 'Pending',
      clientFeedbackStatus: 'No Feedback Yet',
      links: [],
      ...prefill,
    };
  }

  useEffect(() => {
    if (open) {
      setDraft(
        editing
          ? {
              title: editing.title,
              type: editing.type,
              clientId: editing.clientId,
              ownerId: editing.ownerId,
              priority: editing.priority,
              currentStage: editing.currentStage,
              status: editing.status,
              startDate: editing.startDate,
              dueDate: editing.dueDate,
              completionDate: editing.completionDate,
              progress: editing.progress,
              description: editing.description,
              chatgptPromptStatus: editing.chatgptPromptStatus,
              claudeBuildStatus: editing.claudeBuildStatus,
              agentIntegrationRequired: editing.agentIntegrationRequired,
              agentIntegrationStatus: editing.agentIntegrationStatus,
              vipulApprovalStatus: editing.vipulApprovalStatus,
              chiraagReviewStatus: editing.chiraagReviewStatus,
              clientFeedbackStatus: editing.clientFeedbackStatus,
              links: editing.links,
            }
          : emptyDraft(),
      );
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<WorkItemInput>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Title is required';
    if (!draft.clientId) errs.clientId = 'A client is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateWorkItem(editing.id, draft);
      toast.success('Work item updated', draft.title);
    } else {
      addWorkItem(draft);
      toast.success('Work item created', `${draft.title} added to the tracker`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ListChecks}
      title={editing ? 'Edit Work Item' : 'Add Dashboard / Agent / Workflow'}
      subtitle="Create or update a research deliverable"
      size="xl"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Create work item'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Basics */}
        <section className="space-y-4">
          <p className="section-title">Basics</p>
          <Field label="Title" required error={errors.title}>
            <TextInput
              value={draft.title}
              invalid={!!errors.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Ownership Signal Dashboard"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Type">
              <Select
                value={draft.type}
                onChange={(v) => set({ type: v as WorkItem['type'] })}
                options={toOptions(WORK_ITEM_TYPES)}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={draft.priority}
                onChange={(v) => set({ priority: v as WorkItem['priority'] })}
                options={toOptions(PRIORITIES)}
              />
            </Field>
            <Field label="Client" required error={errors.clientId}>
              <Select
                value={draft.clientId}
                onChange={(v) => set({ clientId: v })}
                options={data.clients.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="Select client"
                invalid={!!errors.clientId}
              />
            </Field>
            <Field
              label="Owner"
              hint="Leave unassigned if not decided yet"
            >
              <Select
                value={draft.ownerId}
                onChange={(v) => set({ ownerId: v })}
                options={data.teamMembers.map((m) => ({
                  value: m.id,
                  label: m.name,
                }))}
                placeholder="— Not assigned —"
              />
            </Field>
          </div>
          <Field label="Description">
            <TextArea
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="What does this deliverable do for the client?"
            />
          </Field>
        </section>

        {/* Timeline & progress */}
        <section className="space-y-4 border-t border-ink-100 pt-4">
          <p className="section-title">Timeline & progress</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Workflow stage">
              <Select
                value={draft.currentStage}
                onChange={(v) =>
                  set({ currentStage: v as WorkItem['currentStage'] })
                }
                options={toOptions(WORKFLOW_STAGES)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(v) => set({ status: v as WorkItem['status'] })}
                options={toOptions(WORK_ITEM_STATUSES)}
              />
            </Field>
            <Field label={`Progress — ${draft.progress}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.progress}
                onChange={(e) => set({ progress: Number(e.target.value) })}
                className="mt-2.5 w-full accent-brand-500"
              />
            </Field>
            <Field label="Start date">
              <DateInput
                value={draft.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </Field>
            <Field label="Due date">
              <DateInput
                value={draft.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </Field>
            <Field label="Completion date" hint="Set when fully completed">
              <DateInput
                value={draft.completionDate ?? ''}
                onChange={(e) =>
                  set({ completionDate: e.target.value || null })
                }
              />
            </Field>
          </div>
        </section>

        {/* Delivery pipeline */}
        <section className="space-y-4 border-t border-ink-100 pt-4">
          <p className="section-title">Delivery pipeline status</p>
          <div className="rounded-xl bg-ink-50 p-3">
            <Toggle
              checked={draft.agentIntegrationRequired}
              onChange={(checked) =>
                set({
                  agentIntegrationRequired: checked,
                  agentIntegrationStatus: checked
                    ? draft.agentIntegrationStatus === 'Not Required'
                      ? 'Not Started'
                      : draft.agentIntegrationStatus
                    : 'Not Required',
                })
              }
              label="Munshot agent integration required"
              description="Toggle on if this deliverable needs a Munshot agent wired in"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ChatGPT master prompt">
              <Select
                value={draft.chatgptPromptStatus}
                onChange={(v) =>
                  set({ chatgptPromptStatus: v as WorkItem['chatgptPromptStatus'] })
                }
                options={toOptions(STEP_STATUSES)}
              />
            </Field>
            <Field label="Claude build">
              <Select
                value={draft.claudeBuildStatus}
                onChange={(v) =>
                  set({ claudeBuildStatus: v as WorkItem['claudeBuildStatus'] })
                }
                options={toOptions(STEP_STATUSES)}
              />
            </Field>
            <Field label="Agent integration">
              <Select
                value={draft.agentIntegrationStatus}
                onChange={(v) =>
                  set({
                    agentIntegrationStatus:
                      v as WorkItem['agentIntegrationStatus'],
                  })
                }
                options={toOptions(STEP_STATUSES)}
                disabled={!draft.agentIntegrationRequired}
              />
            </Field>
            <Field label="Vipul approval">
              <Select
                value={draft.vipulApprovalStatus}
                onChange={(v) =>
                  set({ vipulApprovalStatus: v as WorkItem['vipulApprovalStatus'] })
                }
                options={toOptions(APPROVAL_STATUSES)}
              />
            </Field>
            <Field label="Chiraag review">
              <Select
                value={draft.chiraagReviewStatus}
                onChange={(v) =>
                  set({ chiraagReviewStatus: v as WorkItem['chiraagReviewStatus'] })
                }
                options={toOptions(REVIEW_STATUSES)}
              />
            </Field>
            <Field label="Client feedback">
              <Select
                value={draft.clientFeedbackStatus}
                onChange={(v) =>
                  set({
                    clientFeedbackStatus:
                      v as WorkItem['clientFeedbackStatus'],
                  })
                }
                options={toOptions(CLIENT_FEEDBACK_STATUSES)}
              />
            </Field>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-3 border-t border-ink-100 pt-4">
          <p className="section-title">Links</p>
          <LinksEditor
            value={draft.links}
            onChange={(links) => set({ links })}
          />
        </section>
      </div>
    </Modal>
  );
}
