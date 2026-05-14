import { motion } from 'framer-motion';
import { Calendar, Link2, Pencil, Trash2 } from 'lucide-react';
import type { ClientMeetingRecording } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { RecordingTypeBadge } from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { YouTubeThumb } from '@/components/ui/YouTubeEmbed';
import { formatDate } from '@/utils/dates';

interface Props {
  recording: ClientMeetingRecording;
  onView: () => void;
}

export function MeetingRecordingCard({ recording, onView }: Props) {
  const { getClient, getMember, deleteRecording } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();

  const client = getClient(recording.clientId);
  const owner = getMember(recording.ownerId);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this recording?',
      description: `“${recording.title}” will be removed and unlinked from ${recording.linkedWorkItemIds.length} work item(s).`,
      confirmLabel: 'Delete recording',
      tone: 'danger',
    });
    if (ok) {
      deleteRecording(recording.id);
      toast.success('Recording deleted', recording.title);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card card-hover flex flex-col overflow-hidden"
    >
      <YouTubeThumb
        url={recording.youtubeUrl}
        title={recording.title}
        onClick={onView}
        className="rounded-none"
      />
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onView}
            className="min-w-0 flex-1 text-left"
          >
            <p className="line-clamp-2 text-sm font-bold text-ink-800 hover:text-brand-600">
              {recording.title}
            </p>
          </button>
          <ActionMenu
            actions={[
              { label: 'View recording', icon: Link2, onClick: onView },
              {
                label: 'Edit recording',
                icon: Pencil,
                onClick: () => ui.editRecording(recording),
              },
              {
                label: 'Delete recording',
                icon: Trash2,
                tone: 'danger',
                onClick: handleDelete,
              },
            ]}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <RecordingTypeBadge type={recording.meetingType} />
          {recording.linkedWorkItemIds.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400">
              <Link2 className="h-3 w-3" />
              {recording.linkedWorkItemIds.length} linked
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(recording.meetingDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 truncate">
            {owner && (
              <Avatar name={owner.name} src={owner.photoUrl} size="xs" />
            )}
            <span className="truncate">{owner?.name ?? 'Unknown'}</span>
          </span>
        </div>
        {client && (
          <p className="mt-1 truncate text-[11px] font-semibold text-brand-600">
            {client.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}
