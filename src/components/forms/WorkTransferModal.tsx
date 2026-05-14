import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, AlertCircle } from 'lucide-react';
import {
  TRANSFER_REASONS,
  TRANSFER_STATUSES,
  type WorkTransfer,
} from '@/types';
import { useStore, type TransferInput } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  DateInput,
  Field,
  Select,
  TextArea,
  toOptions,
} from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { TransferStatusBadge } from '@/components/ui/Badge';
import { todayISO } from '@/utils/dates';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: WorkTransfer;
  prefill?: Partial<TransferInput>;
}

export function WorkTransferModal({ open, onClose, editing, prefill }: Props) {
  const { addTransfer, updateTransfer, data, getMember, getWorkItem } =
    useStore();
  const toast = useToast();
  // Must be declared before the useState initializer below — emptyDraft()
  // closes over `lead`, and the initializer runs synchronously on first render.
  const lead = data.teamMembers.find((m) => m.role === 'Team Lead - Intern');
  const [draft, setDraft] = useState<TransferInput>(() => emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function emptyDraft(): TransferInput {
    const base: TransferInput = {
      workItemId: '',
      fromOwnerId: '',
      toOwnerId: '',
      requestedById: lead?.id ?? data.teamMembers[0]?.id ?? '',
      approvedById: null,
      transferDate: todayISO(),
      reason: 'Workload Balancing',
      notes: '',
      status: 'Pending',
      ...prefill,
    };
    if (base.workItemId) {
      const wi = data.workItems.find((w) => w.id === base.workItemId);
      if (wi) base.fromOwnerId = wi.ownerId;
    }
    return base;
  }

  useEffect(() => {
    if (open) {
      setDraft(
        editing
          ? {
              workItemId: editing.workItemId,
              fromOwnerId: editing.fromOwnerId,
              toOwnerId: editing.toOwnerId,
              requestedById: editing.requestedById,
              approvedById: editing.approvedById,
              transferDate: editing.transferDate,
              reason: editing.reason,
              notes: editing.notes,
              status: editing.status,
            }
          : emptyDraft(),
      );
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<TransferInput>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onWorkItemChange = (id: string) => {
    const wi = data.workItems.find((w) => w.id === id);
    set({ workItemId: id, fromOwnerId: wi?.ownerId ?? '' });
  };

  const fromOwner = getMember(draft.fromOwnerId);
  const workItem = getWorkItem(draft.workItemId);

  const toOwnerOptions = useMemo(
    () =>
      data.teamMembers
        .filter((m) => m.id !== draft.fromOwnerId)
        .map((m) => ({ value: m.id, label: `${m.name} · ${m.role}` })),
    [data.teamMembers, draft.fromOwnerId],
  );

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!editing) {
      if (!draft.workItemId) errs.workItemId = 'Select a work item';
      if (!draft.toOwnerId) errs.toOwnerId = 'Select the new owner';
      if (draft.toOwnerId && draft.toOwnerId === draft.fromOwnerId)
        errs.toOwnerId = 'New owner must differ from the current owner';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (editing) {
      updateTransfer(editing.id, {
        reason: draft.reason,
        notes: draft.notes,
        transferDate: draft.transferDate,
        requestedById: draft.requestedById,
        approvedById: draft.approvedById,
      });
      toast.success('Transfer updated');
      onClose();
      return;
    }

    const ownershipMoves =
      draft.status === 'Approved' || draft.status === 'Completed';
    const result = addTransfer({
      ...draft,
      approvedById: ownershipMoves
        ? (draft.approvedById ?? lead?.id ?? null)
        : null,
    });
    if (!result.ok) {
      setErrors({ form: result.error ?? 'Could not create transfer' });
      toast.error('Transfer blocked', result.error);
      return;
    }
    toast.success(
      'Transfer created',
      ownershipMoves
        ? 'Ownership has been updated'
        : 'Pending approval — ownership unchanged',
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ArrowLeftRight}
      title={editing ? 'Edit Work Transfer' : 'Transfer Work'}
      subtitle="Move ownership of a dashboard, agent or workflow"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Create transfer'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {errors.form && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.form}
          </div>
        )}

        <Field label="Work item" required error={errors.workItemId}>
          {editing ? (
            <div className="input flex items-center bg-ink-50 font-semibold text-ink-700">
              {workItem?.title ?? 'Unknown work item'}
            </div>
          ) : (
            <Select
              value={draft.workItemId}
              onChange={onWorkItemChange}
              options={data.workItems.map((w) => ({
                value: w.id,
                label: `${w.title} · ${w.type}`,
              }))}
              placeholder="Select a work item"
              invalid={!!errors.workItemId}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current owner (from)">
            <div className="input flex items-center gap-2 bg-ink-50">
              {fromOwner ? (
                <>
                  <Avatar
                    name={fromOwner.name}
                    src={fromOwner.photoUrl}
                    size="xs"
                  />
                  <span className="font-semibold text-ink-700">
                    {fromOwner.name}
                  </span>
                </>
              ) : (
                <span className="text-ink-400">Select a work item first</span>
              )}
            </div>
          </Field>
          <Field label="New owner (to)" required error={errors.toOwnerId}>
            {editing ? (
              <div className="input flex items-center gap-2 bg-ink-50">
                <span className="font-semibold text-ink-700">
                  {getMember(draft.toOwnerId)?.name ?? 'Unknown'}
                </span>
              </div>
            ) : (
              <Select
                value={draft.toOwnerId}
                onChange={(v) => set({ toOwnerId: v })}
                options={toOwnerOptions}
                placeholder="Select the new owner"
                invalid={!!errors.toOwnerId}
              />
            )}
          </Field>
          <Field label="Reason">
            <Select
              value={draft.reason}
              onChange={(v) => set({ reason: v as WorkTransfer['reason'] })}
              options={toOptions(TRANSFER_REASONS)}
            />
          </Field>
          <Field label="Transfer date">
            <DateInput
              value={draft.transferDate}
              onChange={(e) => set({ transferDate: e.target.value })}
            />
          </Field>
          <Field label="Requested by">
            <Select
              value={draft.requestedById}
              onChange={(v) => set({ requestedById: v })}
              options={data.teamMembers.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
            />
          </Field>
          <Field label="Status">
            {editing ? (
              <div className="flex h-[2.7rem] items-center">
                <TransferStatusBadge status={draft.status} />
                <span className="ml-2 text-xs text-ink-400">
                  Change via the table actions
                </span>
              </div>
            ) : (
              <Select
                value={draft.status}
                onChange={(v) =>
                  set({ status: v as WorkTransfer['status'] })
                }
                options={toOptions(TRANSFER_STATUSES)}
              />
            )}
          </Field>
          {editing && (
            <Field label="Approved by">
              <Select
                value={draft.approvedById ?? ''}
                onChange={(v) => set({ approvedById: v || null })}
                options={data.teamMembers.map((m) => ({
                  value: m.id,
                  label: m.name,
                }))}
                placeholder="Not yet approved"
              />
            </Field>
          )}
        </div>

        {!editing && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <strong>Pending</strong> transfers keep the current owner. Choosing{' '}
            <strong>Approved</strong> or <strong>Completed</strong> moves
            ownership immediately and preserves the previous owner in history.
          </p>
        )}

        <Field label="Notes">
          <TextArea
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Context for the transfer…"
          />
        </Field>
      </div>
    </Modal>
  );
}
