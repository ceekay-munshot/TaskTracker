import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCheck,
  ExternalLink,
  Pencil,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import type { WorkTransfer } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Badge, TransferStatusBadge, TypeBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/dates';

export function WorkTransferTable({
  transfers,
}: {
  transfers: WorkTransfer[];
}) {
  const {
    getMember,
    getWorkItem,
    getClient,
    approveTransfer,
    rejectTransfer,
    completeTransfer,
    deleteTransfer,
  } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  if (transfers.length === 0) {
    return (
      <EmptyState
        icon={ArrowRight}
        title="No transfers match"
        description="Adjust the filters or create a new work transfer."
        compact
      />
    );
  }

  const handleDelete = async (t: WorkTransfer) => {
    const ok = await confirm({
      title: 'Delete this transfer record?',
      description:
        'The audit record is removed. Ownership history on the work item is preserved.',
      confirmLabel: 'Delete transfer',
      tone: 'danger',
    });
    if (ok) {
      deleteTransfer(t.id);
      toast.success('Transfer deleted');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
            <th className="px-3 pb-1">Work item</th>
            <th className="px-2 pb-1">Client</th>
            <th className="px-2 pb-1">From → To</th>
            <th className="px-2 pb-1">Reason</th>
            <th className="px-2 pb-1">Requested / Approved</th>
            <th className="px-2 pb-1">Date</th>
            <th className="px-2 pb-1">Status</th>
            <th className="px-2 pb-1" />
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => {
            const workItem = getWorkItem(t.workItemId);
            const client = getClient(workItem?.clientId);
            const from = getMember(t.fromOwnerId);
            const to = getMember(t.toOwnerId);
            const requestedBy = getMember(t.requestedById);
            const approvedBy = getMember(t.approvedById);
            return (
              <tr key={t.id} className="[&>td]:bg-white/70">
                <td className="rounded-l-xl px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      workItem && ui.openWorkItem(workItem.id)
                    }
                    className="text-left font-bold text-ink-800 hover:text-brand-600"
                  >
                    {workItem?.title ?? 'Unknown work item'}
                  </button>
                  {workItem && (
                    <div className="mt-1">
                      <TypeBadge type={workItem.type} />
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5 text-xs font-semibold text-ink-600">
                  {client?.name ?? '—'}
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={from?.name ?? '?'}
                      src={from?.photoUrl}
                      size="xs"
                    />
                    <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                    <Avatar
                      name={to?.name ?? '?'}
                      src={to?.photoUrl}
                      size="xs"
                    />
                    <span className="ml-1 text-xs text-ink-500">
                      {from?.name?.split(' ')[0] ?? '?'} →{' '}
                      {to?.name?.split(' ')[0] ?? '?'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <Badge color="violet" size="xs" soft>
                    {t.reason}
                  </Badge>
                  {t.notes && (
                    <p
                      className="mt-1 max-w-[220px] truncate text-[11px] text-ink-400"
                      title={t.notes}
                    >
                      {t.notes}
                    </p>
                  )}
                </td>
                <td className="px-2 py-2.5 text-xs text-ink-500">
                  <p>{requestedBy?.name ?? '—'}</p>
                  <p className="text-ink-400">
                    {approvedBy ? `✓ ${approvedBy.name}` : 'not approved'}
                  </p>
                </td>
                <td className="px-2 py-2.5 text-xs text-ink-500">
                  {formatDate(t.transferDate)}
                </td>
                <td className="px-2 py-2.5">
                  <TransferStatusBadge status={t.status} />
                </td>
                <td className="rounded-r-xl px-2 py-2.5">
                  <ActionMenu
                    actions={[
                      {
                        label: 'Approve transfer',
                        icon: Check,
                        hidden: t.status !== 'Pending',
                        onClick: () => {
                          approveTransfer(t.id);
                          toast.success('Transfer approved', 'Ownership updated');
                        },
                      },
                      {
                        label: 'Reject transfer',
                        icon: X,
                        tone: 'danger',
                        hidden: t.status !== 'Pending',
                        onClick: () => {
                          rejectTransfer(t.id);
                          toast.info('Transfer rejected');
                        },
                      },
                      {
                        label: 'Mark completed',
                        icon: CheckCheck,
                        hidden:
                          t.status === 'Completed' ||
                          t.status === 'Rejected',
                        onClick: () => {
                          completeTransfer(t.id);
                          toast.success('Transfer completed');
                        },
                      },
                      {
                        label: 'Edit transfer',
                        icon: Pencil,
                        onClick: () => ui.editTransfer(t),
                      },
                      {
                        label: 'Open work item',
                        icon: ExternalLink,
                        hidden: !workItem,
                        onClick: () =>
                          workItem && ui.openWorkItem(workItem.id),
                      },
                      {
                        label: 'Open previous owner',
                        icon: UserRound,
                        hidden: !from,
                        onClick: () =>
                          from && navigate(`/team/${from.id}`),
                      },
                      {
                        label: 'Open new owner',
                        icon: UserRound,
                        hidden: !to,
                        onClick: () => to && navigate(`/team/${to.id}`),
                      },
                      {
                        label: 'Delete transfer',
                        icon: Trash2,
                        tone: 'danger',
                        onClick: () => handleDelete(t),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
