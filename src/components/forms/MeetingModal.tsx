import { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import {
  MEETING_FREQUENCIES,
  MEETING_STATUSES,
  MEETING_TYPES,
  type Meeting,
} from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  DateInput,
  Field,
  NumberInput,
  Select,
  TextArea,
  TextInput,
  toOptions,
} from '@/components/ui/Field';
import { todayISO } from '@/utils/dates';

type Draft = Omit<Meeting, 'id'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Meeting;
  prefill?: Partial<Draft>;
}

const emptyDraft = (prefill?: Partial<Draft>): Draft => ({
  title: '',
  clientId: null,
  ownerId: '',
  date: todayISO(),
  time: '10:00',
  duration: 30,
  frequency: 'One-time',
  notes: '',
  meetingType: 'Client Call',
  status: 'Scheduled',
  ...prefill,
});

export function MeetingModal({ open, onClose, editing, prefill }: Props) {
  const { addMeeting, updateMeeting, data } = useStore();
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

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Meeting title is required';
    if (!draft.ownerId) errs.ownerId = 'An owner is required';
    if (!draft.date) errs.date = 'A date is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateMeeting(editing.id, draft);
      toast.success('Meeting updated', draft.title);
    } else {
      addMeeting(draft);
      toast.success('Meeting scheduled', draft.title);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CalendarPlus}
      title={editing ? 'Edit Meeting' : 'Add Meeting'}
      subtitle="Schedule a client or internal meeting"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add meeting'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Meeting title" required error={errors.title}>
          <TextInput
            value={draft.title}
            invalid={!!errors.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Meridian — Weekly Coverage Sync"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meeting type">
            <Select
              value={draft.meetingType}
              onChange={(v) =>
                set({ meetingType: v as Meeting['meetingType'] })
              }
              options={toOptions(MEETING_TYPES)}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v as Meeting['status'] })}
              options={toOptions(MEETING_STATUSES)}
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
              placeholder="Internal (no client)"
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
          <Field label="Date" required error={errors.date}>
            <DateInput
              value={draft.date}
              invalid={!!errors.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </Field>
          <Field label="Time">
            <TextInput
              type="time"
              value={draft.time}
              onChange={(e) => set({ time: e.target.value })}
            />
          </Field>
          <Field label="Duration (minutes)">
            <NumberInput
              min={0}
              value={draft.duration}
              onChange={(e) => set({ duration: Number(e.target.value) })}
            />
          </Field>
          <Field label="Frequency">
            <Select
              value={draft.frequency}
              onChange={(v) =>
                set({ frequency: v as Meeting['frequency'] })
              }
              options={toOptions(MEETING_FREQUENCIES)}
            />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Agenda, context, attendees…"
          />
        </Field>
      </div>
    </Modal>
  );
}
