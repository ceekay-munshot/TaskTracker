import { useEffect, useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { CLIENT_STATUSES, type Client, type ClientPOC } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Field, Select, TextArea, TextInput, toOptions } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { uid } from '@/utils/ids';

type Draft = Omit<Client, 'id'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Client;
  prefill?: Partial<Draft>;
}

const newPoc = (): ClientPOC => ({
  id: uid('poc'),
  name: '',
  email: '',
  phone: '',
  role: '',
});

const emptyDraft = (prefill?: Partial<Draft>): Draft => ({
  name: '',
  address: '',
  city: '',
  pocs: [newPoc()],
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
      setDraft(
        editing
          ? {
              ...editing,
              pocs: editing.pocs.length > 0 ? editing.pocs : [newPoc()],
            }
          : emptyDraft(prefill),
      );
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const updatePoc = (id: string, patch: Partial<ClientPOC>) =>
    setDraft((d) => ({
      ...d,
      pocs: d.pocs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const addPoc = () =>
    setDraft((d) => ({ ...d, pocs: [...d.pocs, newPoc()] }));

  const removePoc = (id: string) =>
    setDraft((d) => ({
      ...d,
      pocs: d.pocs.filter((p) => p.id !== id),
    }));

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = 'Client name is required';
    const cleanedPocs = draft.pocs
      .map((p) => ({
        ...p,
        name: p.name.trim(),
        email: p.email.trim(),
        phone: p.phone.trim(),
        role: p.role.trim(),
      }))
      .filter((p) => p.name);
    cleanedPocs.forEach((p) => {
      if (p.email && !/^\S+@\S+\.\S+$/.test(p.email)) {
        errs[`poc-email-${p.id}`] = 'Enter a valid email';
      }
    });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const payload: Draft = { ...draft, pocs: cleanedPocs };
    if (editing) {
      updateClient(editing.id, payload);
      toast.success('Client updated', draft.name);
    } else {
      addClient(payload);
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
        </div>

        <section className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Points of contact</p>
              <p className="text-[11px] text-ink-400">
                Add one row per stakeholder; dashboards can pin a specific POC
              </p>
            </div>
            <button
              type="button"
              onClick={addPoc}
              className="btn-soft text-xs"
              title="Add another point of contact"
            >
              <Plus className="h-4 w-4" />
              Add POC
            </button>
          </div>
          <div className="space-y-3">
            {draft.pocs.map((p, idx) => (
              <div
                key={p.id}
                className="rounded-xl border border-ink-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
                    POC #{idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removePoc(p.id)}
                    className="icon-btn text-rose-500"
                    title="Remove this POC"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <TextInput
                      value={p.name}
                      onChange={(e) => updatePoc(p.id, { name: e.target.value })}
                      placeholder="e.g. Daniel Koh"
                    />
                  </Field>
                  <Field label="Role">
                    <TextInput
                      value={p.role}
                      onChange={(e) => updatePoc(p.id, { role: e.target.value })}
                      placeholder="e.g. Head of Research"
                    />
                  </Field>
                  <Field label="Email" error={errors[`poc-email-${p.id}`]}>
                    <TextInput
                      type="email"
                      value={p.email}
                      invalid={!!errors[`poc-email-${p.id}`]}
                      onChange={(e) =>
                        updatePoc(p.id, { email: e.target.value })
                      }
                      placeholder="contact@client.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <TextInput
                      value={p.phone}
                      onChange={(e) =>
                        updatePoc(p.id, { phone: e.target.value })
                      }
                      placeholder="+…"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>

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
