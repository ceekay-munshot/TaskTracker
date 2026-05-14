import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { CLIENT_STATUSES, type Client } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Field, Select, TextArea, TextInput, toOptions } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';

type Draft = Omit<Client, 'id'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Client;
  prefill?: Partial<Draft>;
}

const emptyDraft = (prefill?: Partial<Draft>): Draft => ({
  name: '',
  address: '',
  city: '',
  pointOfContact: '',
  pocEmail: '',
  pocPhone: '',
  logoUrl: '',
  status: 'Active',
  notes: '',
  importanceScore: 6,
  ...prefill,
});

export function ClientModal({ open, onClose, editing, prefill }: Props) {
  const { addClient, updateClient } = useStore();
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
    if (!draft.name.trim()) errs.name = 'Client name is required';
    if (!draft.pointOfContact.trim())
      errs.pointOfContact = 'Point of contact is required';
    if (draft.pocEmail && !/^\S+@\S+\.\S+$/.test(draft.pocEmail))
      errs.pocEmail = 'Enter a valid email';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateClient(editing.id, draft);
      toast.success('Client updated', draft.name);
    } else {
      addClient(draft);
      toast.success('Client added', draft.name);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Building2}
      title={editing ? 'Edit Client' : 'Add Client'}
      subtitle="Institutional account profile"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add client'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
          <Avatar name={draft.name || 'New Client'} src={draft.logoUrl} size="lg" />
          <div className="flex-1">
            <Field label="Logo URL" hint="Leave blank to use auto-generated initials">
              <TextInput
                value={draft.logoUrl}
                onChange={(e) => set({ logoUrl: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name" required error={errors.name}>
            <TextInput
              value={draft.name}
              invalid={!!errors.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Meridian Capital Partners"
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v as Client['status'] })}
              options={toOptions(CLIENT_STATUSES)}
            />
          </Field>
          <Field label="City">
            <TextInput
              value={draft.city}
              onChange={(e) => set({ city: e.target.value })}
              placeholder="e.g. Singapore"
            />
          </Field>
          <Field label="Address">
            <TextInput
              value={draft.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Office address"
            />
          </Field>
          <Field label="Point of contact" required error={errors.pointOfContact}>
            <TextInput
              value={draft.pointOfContact}
              invalid={!!errors.pointOfContact}
              onChange={(e) => set({ pointOfContact: e.target.value })}
              placeholder="e.g. Daniel Koh"
            />
          </Field>
          <Field label="POC phone">
            <TextInput
              value={draft.pocPhone}
              onChange={(e) => set({ pocPhone: e.target.value })}
              placeholder="+…"
            />
          </Field>
          <Field
            label="POC email"
            error={errors.pocEmail}
            className="sm:col-span-2"
          >
            <TextInput
              type="email"
              value={draft.pocEmail}
              invalid={!!errors.pocEmail}
              onChange={(e) => set({ pocEmail: e.target.value })}
              placeholder="contact@client.com"
            />
          </Field>
        </div>

        <Field
          label={`Importance score — ${draft.importanceScore} / 10`}
          hint="Drives health-score weighting and improvement prioritisation"
        >
          <input
            type="range"
            min={1}
            max={10}
            value={draft.importanceScore}
            onChange={(e) =>
              set({ importanceScore: Number(e.target.value) })
            }
            className="w-full accent-brand-500"
          />
        </Field>

        <Field label="Notes">
          <TextArea
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Context about the relationship, expectations, cadence…"
          />
        </Field>
      </div>
    </Modal>
  );
}
