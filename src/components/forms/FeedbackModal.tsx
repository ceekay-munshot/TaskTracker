import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import {
  EFFORT_LEVELS,
  FEEDBACK_SOURCES,
  FEEDBACK_STATUSES,
  IMPACT_LEVELS,
  PRIORITIES,
  type Feedback,
} from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  Field,
  NumberInput,
  Select,
  TextArea,
  toOptions,
} from '@/components/ui/Field';

type Draft = Omit<Feedback, 'id' | 'createdAt'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Feedback;
  prefill?: Partial<Draft>;
}

export function FeedbackModal({ open, onClose, editing, prefill }: Props) {
  const { addFeedback, updateFeedback, data } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function emptyDraft(): Draft {
    const base: Draft = {
      workItemId: null,
      clientId: null,
      source: 'Original Client',
      feedbackText: '',
      priority: 'Medium',
      effort: 'Medium',
      businessImpact: 'Medium',
      frequencyCount: 1,
      status: 'Open',
      ...prefill,
    };
    if (base.workItemId && !base.clientId) {
      const wi = data.workItems.find((w) => w.id === base.workItemId);
      if (wi) base.clientId = wi.clientId;
    }
    return base;
  }

  useEffect(() => {
    if (open) {
      setDraft(editing ? { ...editing } : emptyDraft());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onWorkItemChange = (id: string) => {
    const wi = data.workItems.find((w) => w.id === id);
    set({ workItemId: id || null, ...(wi ? { clientId: wi.clientId } : {}) });
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.feedbackText.trim())
      errs.feedbackText = 'Feedback text is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateFeedback(editing.id, draft);
      toast.success('Feedback updated');
    } else {
      addFeedback(draft);
      toast.success('Feedback logged', 'Added to the improvement backlog');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={MessageSquarePlus}
      title={editing ? 'Edit Feedback' : 'Add Feedback'}
      subtitle="Feeds the ranked improvement backlog"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add feedback'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Feedback" required error={errors.feedbackText}>
          <TextArea
            value={draft.feedbackText}
            invalid={!!errors.feedbackText}
            rows={3}
            onChange={(e) => set({ feedbackText: e.target.value })}
            placeholder="What does the client / reviewer want changed or improved?"
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
              placeholder="Not linked"
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
          <Field label="Source">
            <Select
              value={draft.source}
              onChange={(v) => set({ source: v as Feedback['source'] })}
              options={toOptions(FEEDBACK_SOURCES)}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v as Feedback['status'] })}
              options={toOptions(FEEDBACK_STATUSES)}
            />
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(v) => set({ priority: v as Feedback['priority'] })}
              options={toOptions(PRIORITIES)}
            />
          </Field>
          <Field
            label="Repeat frequency"
            hint="How many times this has come up"
          >
            <NumberInput
              min={1}
              value={draft.frequencyCount}
              onChange={(e) =>
                set({ frequencyCount: Math.max(1, Number(e.target.value)) })
              }
            />
          </Field>
          <Field label="Business impact">
            <Select
              value={draft.businessImpact}
              onChange={(v) =>
                set({ businessImpact: v as Feedback['businessImpact'] })
              }
              options={toOptions(IMPACT_LEVELS)}
            />
          </Field>
          <Field label="Effort to fix">
            <Select
              value={draft.effort}
              onChange={(v) => set({ effort: v as Feedback['effort'] })}
              options={toOptions(EFFORT_LEVELS)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
