import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Inbox,
  ListChecks,
  MessagesSquare,
  Plus,
  Rocket,
  Sparkles,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  PRIORITIES,
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
  MultiSelect,
  Select,
  TextArea,
  TextInput,
  toOptions,
} from '@/components/ui/Field';
import { todayISO } from '@/utils/dates';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: WorkItem;
  prefill?: Partial<WorkItemInput>;
}

type CheckpointTone =
  | 'sky'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'fuchsia'
  | 'rose';

const CHECKPOINT_TONES: Record<
  CheckpointTone,
  { ring: string; bg: string; text: string; activeBorder: string; activeBg: string }
> = {
  sky: {
    ring: 'bg-sky-100 text-sky-600',
    bg: 'bg-white',
    text: 'text-sky-700',
    activeBorder: 'border-sky-300',
    activeBg: 'bg-gradient-to-br from-sky-50 to-cyan-50',
  },
  indigo: {
    ring: 'bg-indigo-100 text-indigo-600',
    bg: 'bg-white',
    text: 'text-indigo-700',
    activeBorder: 'border-indigo-300',
    activeBg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
  },
  emerald: {
    ring: 'bg-emerald-100 text-emerald-600',
    bg: 'bg-white',
    text: 'text-emerald-700',
    activeBorder: 'border-emerald-300',
    activeBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
  },
  amber: {
    ring: 'bg-amber-100 text-amber-600',
    bg: 'bg-white',
    text: 'text-amber-700',
    activeBorder: 'border-amber-300',
    activeBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
  },
  fuchsia: {
    ring: 'bg-fuchsia-100 text-fuchsia-600',
    bg: 'bg-white',
    text: 'text-fuchsia-700',
    activeBorder: 'border-fuchsia-300',
    activeBg: 'bg-gradient-to-br from-fuchsia-50 to-pink-50',
  },
  rose: {
    ring: 'bg-rose-100 text-rose-600',
    bg: 'bg-white',
    text: 'text-rose-700',
    activeBorder: 'border-rose-300',
    activeBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
  },
};

function Checkpoint({
  icon: Icon,
  tone,
  title,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  tone: CheckpointTone;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = CHECKPOINT_TONES[tone];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
        checked
          ? `${t.activeBorder} ${t.activeBg} shadow-sm`
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition',
          t.ring,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-xs font-bold leading-tight',
            checked ? t.text : 'text-ink-800',
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-400">
          {description}
        </p>
      </div>
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
          checked
            ? `${t.activeBorder} bg-white`
            : 'border-ink-300 bg-white group-hover:border-ink-400',
        )}
      >
        {checked && <CheckCircle2 className={cn('h-4 w-4', t.text)} />}
      </div>
    </button>
  );
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
    const defaultClient = data.clients[0];
    return {
      title: '',
      type: 'Dashboard',
      clientIds: defaultClient ? [defaultClient.id] : [],
      pocIds: defaultClient?.pocs[0] ? [defaultClient.pocs[0].id] : [],
      ownerIds: [],
      priority: 'Medium',
      clientMeetingDone: false,
      claudeWorkStarted: false,
      liveOnMunshot: false,
      feedbackTaken: false,
      improvementsInProgress: false,
      dashboardFinalized: false,
      statusNote: '',
      status: 'Not Started',
      startDate: todayISO(),
      dueDate: todayISO(),
      completionDate: null,
      progress: 0,
      description: '',
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
              clientIds: editing.clientIds,
              pocIds: editing.pocIds,
              ownerIds: editing.ownerIds,
              priority: editing.priority,
              clientMeetingDone: editing.clientMeetingDone,
              claudeWorkStarted: editing.claudeWorkStarted,
              liveOnMunshot: editing.liveOnMunshot,
              feedbackTaken: editing.feedbackTaken,
              improvementsInProgress: editing.improvementsInProgress,
              dashboardFinalized: editing.dashboardFinalized,
              statusNote: editing.statusNote,
              status: editing.status,
              startDate: editing.startDate,
              dueDate: editing.dueDate,
              completionDate: editing.completionDate,
              progress: editing.progress,
              description: editing.description,
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

  const selectedClients = data.clients.filter((c) =>
    draft.clientIds.includes(c.id),
  );
  const availablePocs = selectedClients.flatMap((c) =>
    c.pocs.map((p) => ({ poc: p, client: c })),
  );

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Title is required';
    if (draft.clientIds.length === 0) errs.clientIds = 'Pick at least one client';
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
            <Field
              label="Clients"
              required
              error={errors.clientIds}
              hint="Tick each client this work is for — appears on every client's tab"
              className="sm:col-span-2"
            >
              <MultiSelect
                value={draft.clientIds}
                onChange={(next) => {
                  const allowedPocIds = data.clients
                    .filter((c) => next.includes(c.id))
                    .flatMap((c) => c.pocs.map((p) => p.id));
                  setDraft((d) => ({
                    ...d,
                    clientIds: next,
                    pocIds: d.pocIds.filter((p) => allowedPocIds.includes(p)),
                  }));
                }}
                options={data.clients.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="Select clients…"
                invalid={!!errors.clientIds}
                emptyHint="No clients yet"
                summary={(count) =>
                  count === 1 ? '1 client' : `${count} clients`
                }
              />
            </Field>
            <Field
              label="Client POCs"
              hint={
                availablePocs.length === 0
                  ? 'No POCs on file for the selected client(s)'
                  : 'Tick each contact you need to report this work to'
              }
              className="sm:col-span-2"
            >
              <MultiSelect
                value={draft.pocIds}
                onChange={(next) => set({ pocIds: next })}
                options={availablePocs.map(({ poc, client }) => ({
                  value: poc.id,
                  label: `${poc.name}${poc.role ? ` · ${poc.role}` : ''} · ${client.name}`,
                }))}
                placeholder="Select POCs…"
                emptyHint="Pick a client first"
                summary={(count) =>
                  count === 1 ? '1 POC' : `${count} POCs`
                }
              />
            </Field>
            <Field
              label="Owners"
              hint="Tick everyone working on this — leave blank if not decided yet"
              className="sm:col-span-2"
            >
              <MultiSelect
                value={draft.ownerIds}
                onChange={(next) => set({ ownerIds: next })}
                options={data.teamMembers.map((m) => ({
                  value: m.id,
                  label: `${m.name} · ${m.role}`,
                }))}
                placeholder="— Not assigned —"
                emptyHint="No team members yet"
                summary={(count) =>
                  count === 1 ? '1 owner' : `${count} owners`
                }
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

        {/* Checkpoints */}
        <section className="space-y-3 border-t border-ink-100 pt-4">
          <div>
            <p className="section-title">Workflow checkpoints</p>
            <p className="text-[11px] text-ink-400">
              Tap each card as the step is done
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const keys = [
                'clientMeetingDone',
                'claudeWorkStarted',
                'liveOnMunshot',
                'feedbackTaken',
                'improvementsInProgress',
                'dashboardFinalized',
              ] as const;
              const setCheckpoint = (idx: number, on: boolean) => {
                setDraft((d) => {
                  const patch: Partial<WorkItemInput> = {};
                  keys.forEach((k, i) => {
                    if (on) {
                      // Reaching stage idx implies every stage before it
                      if (i <= idx) patch[k] = true;
                    } else {
                      // Undoing stage idx means everything after it is undone too
                      if (i >= idx) patch[k] = false;
                    }
                  });
                  return { ...d, ...patch };
                });
              };
              return (
                <>
                  <Checkpoint
                    icon={MessagesSquare}
                    tone="sky"
                    title="Client meeting done"
                    description="Requirements discussed and captured"
                    checked={draft.clientMeetingDone}
                    onChange={(v) => setCheckpoint(0, v)}
                  />
                  <Checkpoint
                    icon={Sparkles}
                    tone="indigo"
                    title="Claude work started"
                    description="Build is in progress on this deliverable"
                    checked={draft.claudeWorkStarted}
                    onChange={(v) => setCheckpoint(1, v)}
                  />
                  <Checkpoint
                    icon={Rocket}
                    tone="emerald"
                    title="Live on Munshot"
                    description="Deployed and live for the client"
                    checked={draft.liveOnMunshot}
                    onChange={(v) => setCheckpoint(2, v)}
                  />
                  <Checkpoint
                    icon={Inbox}
                    tone="amber"
                    title="Took feedback from client"
                    description="Post-launch feedback collected and logged"
                    checked={draft.feedbackTaken}
                    onChange={(v) => setCheckpoint(3, v)}
                  />
                  <Checkpoint
                    icon={Wrench}
                    tone="fuchsia"
                    title="Working on improvements"
                    description="Iterating on feedback right now"
                    checked={draft.improvementsInProgress}
                    onChange={(v) => setCheckpoint(4, v)}
                  />
                  <Checkpoint
                    icon={CheckCircle2}
                    tone="rose"
                    title="Finalized dashboard"
                    description="Everything wrapped — work is done"
                    checked={draft.dashboardFinalized}
                    onChange={(v) => setCheckpoint(5, v)}
                  />
                </>
              );
            })()}
          </div>
        </section>

        {/* Status note */}
        <section className="space-y-3 border-t border-ink-100 pt-4">
          <div>
            <p className="section-title">Current status note</p>
            <p className="text-[11px] text-ink-400">
              End-of-day note — what's the latest on this task?
            </p>
          </div>
          <TextArea
            value={draft.statusNote}
            onChange={(e) => set({ statusNote: e.target.value })}
            placeholder="e.g. Finalised data model, waiting on quarterly revenue file from client by tomorrow…"
          />
        </section>

        {/* Timeline & progress */}
        <section className="space-y-4 border-t border-ink-100 pt-4">
          <p className="section-title">Timeline & progress</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
