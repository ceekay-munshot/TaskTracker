import { useState } from 'react';
import {
  ArrowLeftRight,
  CheckSquare,
  Clock,
  ExternalLink,
  Gauge,
  History,
  ListChecks,
  MessageSquarePlus,
  Pencil,
  Video,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { Drawer } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import {
  Badge,
  PriorityBadge,
  StatusBadge,
  TaskStatusBadge,
  TransferStatusBadge,
  TypeBadge,
  WorkflowStageBadge,
} from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MiniStat } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { TimelineReplay } from '@/components/TimelineReplay';
import { ImprovementPriorityList } from '@/components/ImprovementPriorityList';
import { daysUntil, formatDate } from '@/utils/dates';
import { effectiveStatus } from '@/utils/workItem';
import { getYouTubeWatchUrl } from '@/utils/youtube';

interface Props {
  workItemId: string | null;
  onClose: () => void;
}

function PipelineRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-2">
      <span className="text-xs font-semibold text-ink-500">{label}</span>
      {children}
    </div>
  );
}

export function WorkItemDetailDrawer({ workItemId, onClose }: Props) {
  const { data, getMember, getClient } = useStore();
  const ui = useUI();
  const [tab, setTab] = useState('overview');

  const workItem = workItemId
    ? data.workItems.find((w) => w.id === workItemId)
    : undefined;

  const open = Boolean(workItem);
  const wi = workItem;

  const owner = wi ? getMember(wi.ownerId) : undefined;
  const originalOwner = wi ? getMember(wi.originalOwnerId) : undefined;
  const allClients = wi
    ? wi.clientIds.map(getClient).filter((c): c is NonNullable<typeof c> => !!c)
    : [];

  const tasks = wi
    ? data.tasks.filter((t) => t.workItemId === wi.id)
    : [];
  const feedback = wi
    ? data.feedback.filter((f) => f.workItemId === wi.id)
    : [];
  const transfers = wi
    ? data.transfers
        .filter((t) => t.workItemId === wi.id)
        .sort((a, b) => a.transferDate.localeCompare(b.transferDate))
    : [];
  const recordings = wi
    ? data.recordings.filter((r) => r.linkedWorkItemIds.includes(wi.id))
    : [];

  const due = wi ? daysUntil(wi.dueDate) : 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      icon={ListChecks}
      title={wi?.title ?? 'Work item'}
      subtitle={wi ? `${wi.type} · ${allClients.map((c) => c.name).join(', ') || 'Unknown client'}` : ''}
      footer={
        wi && (
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                ui.addTask({
                  workItemId: wi.id,
                  clientId: wi.clientId,
                  ownerId: wi.ownerId,
                })
              }
            >
              <CheckSquare className="h-4 w-4" /> Task
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                ui.addFeedback({ workItemId: wi.id, clientId: wi.clientId })
              }
            >
              <MessageSquarePlus className="h-4 w-4" /> Feedback
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => ui.addTransfer({ workItemId: wi.id })}
            >
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.editWorkItem(wi)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </>
        )
      }
    >
      {wi && (
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={wi.type} />
            <StatusBadge status={effectiveStatus(wi, data.workflowStages)} />
            <PriorityBadge priority={wi.priority} />
            <WorkflowStageBadge stage={wi.currentStage} />
            {wi.hasPendingTransfer && (
              <Badge color="amber" soft>
                <ArrowLeftRight className="h-3 w-3" /> Pending transfer
              </Badge>
            )}
          </div>

          {wi.description && (
            <p className="text-sm leading-relaxed text-ink-600">
              {wi.description}
            </p>
          )}

          {/* People */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="label-text">
                {wi.ownerIds.length > 1 ? 'Current owners' : 'Current owner'}
              </p>
              {wi.ownerIds.length === 0 ? (
                <span className="text-sm font-bold text-ink-400">
                  Unassigned
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {wi.ownerIds.map((id) => {
                    const m = getMember(id);
                    if (!m) return null;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <Avatar name={m.name} src={m.photoUrl} size="sm" />
                        <span className="text-sm font-bold text-ink-800">
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {originalOwner && originalOwner.id !== owner?.id && (
              <div>
                <p className="label-text">Originally assigned</p>
                <div className="flex items-center gap-2">
                  <Avatar
                    name={originalOwner.name}
                    src={originalOwner.photoUrl}
                    size="sm"
                  />
                  <span className="text-sm font-bold text-ink-800">
                    {originalOwner.name}
                  </span>
                </div>
              </div>
            )}
            {(() => {
              const pocs = allClients
                .flatMap((c) => c.pocs.map((p) => ({ poc: p, client: c })))
                .filter(({ poc }) => wi.pocIds.includes(poc.id));
              if (pocs.length === 0) return null;
              return (
                <div>
                  <p className="label-text">
                    Client POC{pocs.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1.5">
                    {pocs.map(({ poc, client }) => (
                      <div key={poc.id}>
                        <p className="text-sm font-bold text-ink-800">
                          {poc.name}
                          {poc.role && (
                            <span className="ml-1 text-xs font-medium text-ink-400">
                              · {poc.role}
                            </span>
                          )}
                          {allClients.length > 1 && (
                            <span className="ml-1 text-xs font-medium text-ink-400">
                              · {client.name}
                            </span>
                          )}
                        </p>
                        {(poc.email || poc.phone) && (
                          <p className="text-[11px] text-ink-400">
                            {poc.email}
                            {poc.email && poc.phone ? ' · ' : ''}
                            {poc.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <MiniStat
              label="Progress"
              value={`${wi.progress}%`}
              icon={Gauge}
              color="indigo"
            />
            <MiniStat
              label={wi.status === 'Completed' ? 'Completed' : 'Due'}
              value={
                wi.status === 'Completed'
                  ? formatDate(wi.completionDate)
                  : due < 0
                    ? `${-due}d over`
                    : `${due}d`
              }
              icon={Clock}
              color={
                wi.status === 'Completed'
                  ? 'emerald'
                  : due < 0
                    ? 'rose'
                    : due <= 7
                      ? 'amber'
                      : 'sky'
              }
            />
          </div>

          <ProgressBar
            value={wi.progress}
            showLabel
            color={wi.progress >= 100 ? 'emerald' : 'indigo'}
          />

          <Tabs
            layoutId="wi-drawer-tabs"
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'timeline', label: 'Timeline' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Workflow checkpoints */}
              <div>
                <p className="section-title mb-2">Workflow checkpoints</p>
                <div className="space-y-1.5">
                  <PipelineRow label="Client meeting">
                    <Badge color={wi.clientMeetingDone ? 'emerald' : 'slate'} soft>
                      {wi.clientMeetingDone ? 'Done' : 'Not done'}
                    </Badge>
                  </PipelineRow>
                  <PipelineRow label="Claude work">
                    <Badge color={wi.claudeWorkStarted ? 'indigo' : 'slate'} soft>
                      {wi.claudeWorkStarted ? 'Started' : 'Not started'}
                    </Badge>
                  </PipelineRow>
                  <PipelineRow label="Live on Munshot">
                    <Badge color={wi.liveOnMunshot ? 'emerald' : 'slate'} soft>
                      {wi.liveOnMunshot ? 'Live' : 'Not live'}
                    </Badge>
                  </PipelineRow>
                  <PipelineRow label="Took feedback from client">
                    <Badge color={wi.feedbackTaken ? 'amber' : 'slate'} soft>
                      {wi.feedbackTaken ? 'Received' : 'Pending'}
                    </Badge>
                  </PipelineRow>
                  <PipelineRow label="Working on improvements">
                    <Badge
                      color={wi.improvementsInProgress ? 'fuchsia' : 'slate'}
                      soft
                    >
                      {wi.improvementsInProgress ? 'In progress' : 'Not started'}
                    </Badge>
                  </PipelineRow>
                  <PipelineRow label="Finalized dashboard">
                    <Badge color={wi.dashboardFinalized ? 'emerald' : 'slate'} soft>
                      {wi.dashboardFinalized ? 'Finalized' : 'Not finalized'}
                    </Badge>
                  </PipelineRow>
                </div>
              </div>

              {/* Current status note */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="section-title">Current status note</p>
                  {wi.statusNoteUpdatedAt && (
                    <span className="text-[11px] text-ink-400">
                      Updated {formatDate(wi.statusNoteUpdatedAt)}
                    </span>
                  )}
                </div>
                {wi.statusNote ? (
                  <p className="rounded-xl border border-ink-100 bg-amber-50/40 p-3 text-sm leading-relaxed text-ink-700">
                    {wi.statusNote}
                  </p>
                ) : (
                  <p className="rounded-xl border border-dashed border-ink-200 p-3 text-center text-xs text-ink-400">
                    No status note yet — edit the work item to add one.
                  </p>
                )}
              </div>

              {/* Tasks */}
              <div>
                <p className="section-title mb-2">Tasks ({tasks.length})</p>
                {tasks.length === 0 ? (
                  <p className="text-xs text-ink-400">No tasks yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {tasks.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => ui.editTask(t)}
                          className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-ink-700 hover:text-brand-600"
                        >
                          {t.title}
                        </button>
                        <span className="shrink-0 text-[11px] text-ink-400">
                          {formatDate(t.dueDate)}
                        </span>
                        <TaskStatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Feedback */}
              <div>
                <p className="section-title mb-2">
                  Improvement backlog ({feedback.length})
                </p>
                <ImprovementPriorityList
                  feedback={feedback}
                  emptyHint="No feedback logged for this deliverable yet."
                />
              </div>

              {/* Transfers */}
              <div>
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Transfer history ({transfers.length})
                </p>
                {transfers.length === 0 ? (
                  <p className="text-xs text-ink-400">
                    Never transferred — same owner since creation.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {transfers.map((t) => {
                      const from = getMember(t.fromOwnerId);
                      const to = getMember(t.toOwnerId);
                      return (
                        <li
                          key={t.id}
                          className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-2 text-xs"
                        >
                          <span className="font-semibold text-ink-600">
                            {from?.name ?? '?'} → {to?.name ?? '?'}
                          </span>
                          <span className="text-ink-400">· {t.reason}</span>
                          <span className="ml-auto text-ink-400">
                            {formatDate(t.transferDate)}
                          </span>
                          <TransferStatusBadge status={t.status} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Recordings */}
              <div>
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  Linked recordings ({recordings.length})
                </p>
                {recordings.length === 0 ? (
                  <p className="text-xs text-ink-400">
                    No meeting recordings linked.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {recordings.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs"
                      >
                        <Video className="h-3.5 w-3.5 shrink-0 text-fuchsia-500" />
                        <span className="min-w-0 flex-1 truncate font-semibold text-ink-700">
                          {r.title}
                        </span>
                        <a
                          href={getYouTubeWatchUrl(r.youtubeUrl) ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-ink-400 hover:text-brand-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Links */}
              {wi.links.length > 0 && (
                <div>
                  <p className="section-title mb-2">Links</p>
                  <ul className="space-y-1">
                    {wi.links.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === 'timeline' && <TimelineReplay workItemId={wi.id} />}
        </div>
      )}
      {!wi && <EmptyState title="Work item not found" />}
    </Drawer>
  );
}
