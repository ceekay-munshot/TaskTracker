import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import type { WorkflowStageConfig } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { TextArea, TextInput } from '@/components/ui/Field';
import { cn } from '@/utils/cn';
import { daysBetween, todayISO } from '@/utils/dates';
import { average } from '@/utils/collections';

const BOTTLENECK_DAYS = 14;

export function WorkflowMap() {
  const {
    data,
    derived,
    updateWorkflowStage,
    reorderWorkflowStage,
    deleteWorkflowStage,
  } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  const stages = [...data.workflowStages].sort((a, b) => a.order - b.order);

  const startEdit = (stage: WorkflowStageConfig) => {
    setEditingId(stage.id);
    setDraftLabel(stage.shortLabel);
    setDraftDesc(stage.description);
  };

  const saveEdit = (id: string) => {
    updateWorkflowStage(id, {
      shortLabel: draftLabel.trim() || 'Stage',
      description: draftDesc.trim(),
    });
    setEditingId(null);
    toast.success('Workflow stage updated');
  };

  const handleDelete = async (stage: WorkflowStageConfig) => {
    const count = data.workItems.filter(
      (w) => w.currentStage === stage.stage,
    ).length;
    const ok = await confirm({
      title: `Delete the "${stage.stage}" stage?`,
      description:
        count > 0
          ? `${count} work item${count === 1 ? '' : 's'} ${
              count === 1 ? 'is' : 'are'
            } currently in this stage — they keep their label, but the stage will no longer appear in the workflow map. This cannot be undone.`
          : 'This removes the stage from the workflow map. This cannot be undone.',
      confirmLabel: 'Delete stage',
      tone: 'danger',
    });
    if (ok) {
      deleteWorkflowStage(stage.id);
      toast.success('Workflow stage deleted', stage.stage);
    }
  };

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const itemsInStage = data.workItems.filter(
          (w) => w.currentStage === stage.stage,
        );
        const activeCount = itemsInStage.length;

        const daysList = itemsInStage.map((wi) => {
          const entry = data.timelineEvents
            .filter(
              (e) =>
                e.workItemId === wi.id &&
                e.metadata?.stage === wi.currentStage,
            )
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          return Math.max(
            0,
            daysBetween(entry?.date ?? wi.startDate, todayISO()),
          );
        });
        const avgDays = Math.round(average(daysList));
        const isBottleneck = activeCount > 0 && avgDays >= BOTTLENECK_DAYS;

        const health = { Green: 0, Yellow: 0, Red: 0 };
        let demoReady = 0;
        itemsInStage.forEach((wi) => {
          const h = derived.healthByItem.get(wi.id);
          if (h) health[h.score] += 1;
          if (derived.demoReadyItemIds.has(wi.id)) demoReady += 1;
        });

        const isEditing = editingId === stage.id;

        return (
          <div key={stage.id} className="relative">
            {index < stages.length - 1 && (
              <span className="absolute left-[1.35rem] top-12 z-0 h-[calc(100%-1rem)] w-px bg-ink-200" />
            )}
            <div
              className={cn(
                'relative z-10 flex gap-3 rounded-2xl border bg-white/80 p-3.5 transition',
                isBottleneck
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-ink-200/70',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold',
                  activeCount > 0
                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white'
                    : 'bg-ink-100 text-ink-400',
                )}
              >
                {stage.order}
              </div>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <TextInput
                      value={draftLabel}
                      onChange={(e) => setDraftLabel(e.target.value)}
                      placeholder="Short label"
                    />
                    <TextArea
                      value={draftDesc}
                      rows={2}
                      onChange={(e) => setDraftDesc(e.target.value)}
                      placeholder="Stage description"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary py-1.5 text-xs"
                        onClick={() => saveEdit(stage.id)}
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost py-1.5 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-extrabold text-ink-800">
                        {stage.stage}
                      </p>
                      <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        {stage.shortLabel}
                      </span>
                      {isBottleneck && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                          <AlertTriangle className="h-3 w-3" /> Bottleneck
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                      {stage.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                      <span className="text-ink-600">
                        {activeCount} active
                      </span>
                      <span className="text-ink-400">
                        ~{avgDays}d avg in stage
                      </span>
                      {activeCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Dot count={health.Green} className="bg-emerald-500" />
                          <Dot count={health.Yellow} className="bg-amber-500" />
                          <Dot count={health.Red} className="bg-rose-500" />
                        </span>
                      )}
                      {demoReady > 0 && (
                        <span className="text-emerald-600">
                          {demoReady} demo-ready
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => reorderWorkflowStage(stage.id, 'up')}
                    disabled={index === 0}
                    className="icon-btn h-7 w-7 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(stage)}
                    className="icon-btn h-7 w-7"
                    aria-label="Edit stage"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderWorkflowStage(stage.id, 'down')}
                    disabled={index === stages.length - 1}
                    className="icon-btn h-7 w-7 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(stage)}
                    className="icon-btn h-7 w-7 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete stage"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Dot({ count, className }: { count: number; className: string }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      <span className="text-ink-500">{count}</span>
    </span>
  );
}
