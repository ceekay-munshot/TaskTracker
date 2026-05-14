import {
  Calendar,
  ExternalLink,
  ListChecks,
  Pencil,
  Trash2,
  Video,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Drawer } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { RecordingTypeBadge, TypeBadge } from '@/components/ui/Badge';
import { YouTubeEmbed } from '@/components/ui/YouTubeEmbed';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/dates';
import { getYouTubeWatchUrl } from '@/utils/youtube';

interface Props {
  recordingId: string | null;
  onClose: () => void;
}

export function RecordingDetailDrawer({ recordingId, onClose }: Props) {
  const { data, getClient, getMember, deleteRecording } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();

  const recording = recordingId
    ? data.recordings.find((r) => r.id === recordingId)
    : undefined;

  const client = recording ? getClient(recording.clientId) : undefined;
  const owner = recording ? getMember(recording.ownerId) : undefined;
  const linkedItems = recording
    ? data.workItems.filter((w) =>
        recording.linkedWorkItemIds.includes(w.id),
      )
    : [];

  const handleDelete = async () => {
    if (!recording) return;
    const ok = await confirm({
      title: 'Delete this recording?',
      description: `“${recording.title}” will be removed and unlinked from its work items.`,
      confirmLabel: 'Delete recording',
      tone: 'danger',
    });
    if (ok) {
      deleteRecording(recording.id);
      toast.success('Recording deleted');
      onClose();
    }
  };

  return (
    <Drawer
      open={Boolean(recording)}
      onClose={onClose}
      width="lg"
      icon={Video}
      title={recording?.title ?? 'Recording'}
      subtitle={recording ? recording.meetingType : ''}
      footer={
        recording && (
          <>
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.editRecording(recording)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </>
        )
      }
    >
      {recording ? (
        <div className="space-y-4">
          <YouTubeEmbed url={recording.youtubeUrl} title={recording.title} />

          <div className="flex flex-wrap items-center gap-2">
            <RecordingTypeBadge type={recording.meetingType} />
            <a
              href={getYouTubeWatchUrl(recording.youtubeUrl) ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open on YouTube
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label-text">Client</p>
              <p className="text-sm font-bold text-ink-800">
                {client?.name ?? 'Internal'}
              </p>
            </div>
            <div>
              <p className="label-text">Owner / added by</p>
              <div className="flex items-center gap-2">
                <Avatar
                  name={owner?.name ?? '?'}
                  src={owner?.photoUrl}
                  size="xs"
                />
                <span className="text-sm font-bold text-ink-800">
                  {owner?.name ?? 'Unknown'}
                </span>
              </div>
            </div>
            <div>
              <p className="label-text">Meeting date</p>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-800">
                <Calendar className="h-3.5 w-3.5 text-ink-400" />
                {formatDate(recording.meetingDate)}
              </p>
            </div>
          </div>

          {recording.notes && (
            <div>
              <p className="label-text">Notes</p>
              <p className="rounded-xl bg-ink-50 p-3 text-sm leading-relaxed text-ink-600">
                {recording.notes}
              </p>
            </div>
          )}

          <div>
            <p className="section-title mb-2">
              Linked work items ({linkedItems.length})
            </p>
            {linkedItems.length === 0 ? (
              <p className="text-xs text-ink-400">
                Not linked to any dashboards, agents or workflows.
              </p>
            ) : (
              <ul className="space-y-1">
                {linkedItems.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => ui.openWorkItem(w.id)}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/70 px-2.5 py-2 text-left hover:bg-brand-50"
                    >
                      <ListChecks className="h-4 w-4 shrink-0 text-brand-500" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-700">
                        {w.title}
                      </span>
                      <TypeBadge type={w.type} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <EmptyState title="Recording not found" />
      )}
    </Drawer>
  );
}
