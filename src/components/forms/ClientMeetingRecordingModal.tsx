import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { RECORDING_TYPES, type ClientMeetingRecording } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  ChipToggleGroup,
  DateInput,
  Field,
  Select,
  TextArea,
  TextInput,
  toOptions,
} from '@/components/ui/Field';
import { YouTubeThumb } from '@/components/ui/YouTubeEmbed';
import { isValidYouTubeUrl } from '@/utils/youtube';
import { todayISO } from '@/utils/dates';

type Draft = Omit<ClientMeetingRecording, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: ClientMeetingRecording;
  prefill?: Partial<Draft>;
}

const emptyDraft = (prefill?: Partial<Draft>): Draft => ({
  title: '',
  youtubeUrl: '',
  clientId: null,
  ownerId: '',
  meetingDate: todayISO(),
  meetingType: 'Client Meeting',
  notes: '',
  linkedWorkItemIds: [],
  ...prefill,
});

export function ClientMeetingRecordingModal({
  open,
  onClose,
  editing,
  prefill,
}: Props) {
  const { addRecording, updateRecording, data } = useStore();
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

  const urlValid = draft.youtubeUrl !== '' && isValidYouTubeUrl(draft.youtubeUrl);

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Title is required';
    if (!draft.youtubeUrl.trim()) errs.youtubeUrl = 'YouTube link is required';
    else if (!isValidYouTubeUrl(draft.youtubeUrl))
      errs.youtubeUrl = 'Enter a valid YouTube URL';
    if (!draft.ownerId) errs.ownerId = 'An owner is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateRecording(editing.id, draft);
      toast.success('Recording updated', draft.title);
    } else {
      addRecording(draft);
      toast.success('Recording added', draft.title);
    }
    onClose();
  };

  // filter linked work items to the chosen client (if any) for relevance
  const workItemOptions = data.workItems
    .filter((w) => !draft.clientId || w.clientIds.includes(draft.clientId))
    .map((w) => ({ value: w.id, label: w.title }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Video}
      title={editing ? 'Edit Meeting Recording' : 'Add Client Meeting Recording'}
      subtitle="Link a recorded YouTube meeting to clients & work items"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add recording'}
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
            placeholder="e.g. Meridian — PV Dashboard Requirement Call"
          />
        </Field>

        <Field
          label="YouTube link"
          required
          error={errors.youtubeUrl}
          hint="Supports youtube.com/watch, youtu.be and embed URLs"
        >
          <TextInput
            value={draft.youtubeUrl}
            invalid={!!errors.youtubeUrl}
            onChange={(e) => set({ youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </Field>

        {urlValid && (
          <div className="overflow-hidden rounded-xl border border-ink-100">
            <YouTubeThumb url={draft.youtubeUrl} title={draft.title} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meeting type">
            <Select
              value={draft.meetingType}
              onChange={(v) =>
                set({ meetingType: v as ClientMeetingRecording['meetingType'] })
              }
              options={toOptions(RECORDING_TYPES)}
            />
          </Field>
          <Field label="Meeting date">
            <DateInput
              value={draft.meetingDate}
              onChange={(e) => set({ meetingDate: e.target.value })}
            />
          </Field>
          <Field label="Client">
            <Select
              value={draft.clientId ?? ''}
              onChange={(v) =>
                set({
                  clientId: v || null,
                  linkedWorkItemIds: [],
                })
              }
              options={data.clients.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="Internal (no client)"
            />
          </Field>
          <Field label="Owner / added by" required error={errors.ownerId}>
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
        </div>

        <Field
          label="Linked dashboards / agents / workflows"
          hint={
            workItemOptions.length === 0
              ? 'No work items for the selected client'
              : 'Linking adds a timeline event to each work item'
          }
        >
          <ChipToggleGroup
            options={workItemOptions}
            value={draft.linkedWorkItemIds}
            onChange={(v) => set({ linkedWorkItemIds: v })}
          />
        </Field>

        <Field label="Notes">
          <TextArea
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Key points from the meeting…"
          />
        </Field>
      </div>
    </Modal>
  );
}
