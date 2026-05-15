import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Briefcase,
  CheckCircle2,
  Eye,
  LayoutList,
  Pencil,
  Trash2,
  Video,
} from 'lucide-react';
import type { Client } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { ClientStatusBadge } from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { cn } from '@/utils/cn';

export function ClientCard({ client }: { client: Client }) {
  const { data, deleteClient } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  const work = data.workItems.filter((w) => w.clientId === client.id);
  const totalWork = work.length;
  const activeWork = work.filter((w) => w.status !== 'Completed').length;
  const completedWork = work.filter((w) => w.status === 'Completed').length;
  const pendingTransfers = work.filter((w) => w.hasPendingTransfer).length;
  const recordings = data.recordings.filter(
    (r) => r.clientId === client.id,
  ).length;

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete ${client.name}?`,
      description: `This removes the client. Their ${work.length} work item(s) will show as unassigned. This cannot be undone.`,
      confirmLabel: 'Delete client',
      tone: 'danger',
    });
    if (ok) {
      deleteClient(client.id);
      toast.success('Client deleted', client.name);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card card-hover flex cursor-pointer flex-col p-4"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <div className="flex items-start gap-3">
        <Avatar name={client.name} src={client.logoUrl} size="lg" ring />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-sm font-extrabold leading-tight text-ink-800">
              {client.name}
            </p>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="truncate text-xs text-ink-400">
            {client.city || 'No city'} ·{' '}
            {client.pocs[0]?.name ?? 'No POC'}
            {client.pocs.length > 1
              ? ` · +${client.pocs.length - 1} POC${client.pocs.length > 2 ? 's' : ''}`
              : ''}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
              Importance
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    i < client.importanceScore
                      ? 'bg-brand-500'
                      : 'bg-ink-200',
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-brand-600">
              {client.importanceScore}/10
            </span>
          </div>
        </div>
        <ActionMenu
          actions={[
            {
              label: 'View client',
              icon: Eye,
              onClick: () => navigate(`/clients/${client.id}`),
            },
            {
              label: 'Edit client',
              icon: Pencil,
              onClick: () => ui.editClient(client),
            },
            {
              label: 'Add dashboard / agent',
              icon: Briefcase,
              onClick: () => ui.addWorkItem({ clientId: client.id }),
            },
            {
              label: 'Delete client',
              icon: Trash2,
              tone: 'danger',
              onClick: handleDelete,
            },
          ]}
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-ink-100 pt-3">
        <Stat icon={LayoutList} label="Total" value={totalWork} />
        <Stat icon={Briefcase} label="Active" value={activeWork} />
        <Stat icon={CheckCircle2} label="Completed" value={completedWork} />
        <Stat icon={Video} label="Recordings" value={recordings} />
      </div>

      {pendingTransfers > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {pendingTransfers} pending transfer{pendingTransfers > 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-3 w-3 text-ink-300" />
      <p className="mt-0.5 font-display text-xs font-extrabold text-ink-800">
        {value}
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
    </div>
  );
}
