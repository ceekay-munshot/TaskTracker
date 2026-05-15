import { useEffect, useState } from 'react';
import { ListChecks, Plus, X } from 'lucide-react';
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
  Select,
  TextArea,
  TextInput,
  Toggle,
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
      ownerId: '',
      priority: 'Medium',
      clientMeetingDone: false,
      claudeWorkStarted: false,
      liveOnMunshot: false,
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
              ownerId: editing.ownerId,
              priority: editing.priority,
              clientMeetingDone: editing.clientMeetingDone,
              claudeWorkStarted: editing.claudeWorkStarted,
              liveOnMunshot: editing.liveOnMunshot,
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

  const toggleClient = (id: string) => {
    setDraft((d) => {
      const next = d.clientIds.includes(id)
        ? d.clientIds.filter((c) => c !== id)
        : [...d.clientIds, id];
      const allowedPocIds = data.clients
        .filter((c) => next.includes(c.id))
        .flatMap((c) => c.pocs.map((p) => p.id));
      const keptPocIds = d.pocIds.filter((p) => allowedPocIds.includes(p));
      return {
        ...d,
        clientIds: next,
        pocIds: keptPocIds,
      };
    });
  };

  const togglePoc = (id: string) => {
    setDraft((d) => ({
      ...d,
      pocIds: d.pocIds.includes(id)
        ? d.pocIds.filter((p) => p !== id)
        : [...d.pocIds, id],
    }));
  };

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
              hint="Tap each client this work is for — appears on every client's tab"
              className="sm:col-span-2"
            >
              <div
                className={cn(
                  'flex flex-wrap gap-1.5 rounded-xl border p-2',
                  errors.clientIds
                    ? 'border-rose-400 bg-rose-50/40'
                    : 'border-ink-200 bg-white',
                )}
              >
                {data.clients.length === 0 ? (
                  <span className="text-xs text-ink-400">No clients yet</span>
                ) : (
                  data.clients.map((c) => {
                    const on = draft.clientIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                          on
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })
                )}
              </div>
            </Field>
            <Field
              label="Client POCs"
              hint={
                availablePocs.length === 0
                  ? 'No POCs on file for the selected client(s)'
                  : 'Tap each contact you need to report this work to'
              }
              className="sm:col-span-2"
            >
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-200 bg-white p-2">
                {availablePocs.length === 0 ? (
                  <span className="text-xs text-ink-400">
                    Pick a client first
                  </span>
                ) : (
                  availablePocs.map(({ poc, client }) => {
                    const on = draft.pocIds.includes(poc.id);
                    return (
                      <button
                        key={poc.id}
                        type="button"
                        onClick={() => togglePoc(poc.id)}
                        title={`${client.name}${poc.role ? ` — ${poc.role}` : ''}`}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                          on
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                        )}
                      >
                        {poc.name}
                        <span
                          className={cn(
                            'ml-1 text-[10px] font-medium',
                            on ? 'text-white/80' : 'text-ink-400',
                          )}
                        >
                          · {client.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
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

        {/* Checkpoints */}
        <section className="space-y-3 border-t border-ink-100 pt-4">
          <div>
            <p className="section-title">Workflow checkpoints</p>
            <p className="text-[11px] text-ink-400">
              Three simple flags — toggle on as each step is done
            </p>
          </div>
          <div className="space-y-2 rounded-xl bg-ink-50 p-3">
            <Toggle
              checked={draft.clientMeetingDone}
              onChange={(checked) => set({ clientMeetingDone: checked })}
              label="Client meeting done"
              description="Requirements discussed and captured"
            />
            <Toggle
              checked={draft.claudeWorkStarted}
              onChange={(checked) => set({ claudeWorkStarted: checked })}
              label="Claude work started"
              description="Build is in progress on this deliverable"
            />
            <Toggle
              checked={draft.liveOnMunshot}
              onChange={(checked) => set({ liveOnMunshot: checked })}
              label="Live on Munshot"
              description="Deliverable is deployed and live for the client"
            />
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
