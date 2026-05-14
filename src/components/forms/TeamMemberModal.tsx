import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { MEMBER_STATUSES, TEAM_ROLES, type TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  Field,
  Select,
  TagInput,
  TextArea,
  TextInput,
  toOptions,
} from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { todayISO } from '@/utils/dates';

type Draft = Omit<TeamMember, 'id'>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: TeamMember;
  prefill?: Partial<Draft>;
}

export function TeamMemberModal({ open, onClose, editing, prefill }: Props) {
  const { addTeamMember, updateTeamMember, data } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function emptyDraft(): Draft {
    const lead = data.teamMembers.find(
      (m) => m.role === 'Team Lead - Intern',
    );
    return {
      name: '',
      role: 'Equity Research Intern',
      city: '',
      qualification: '',
      expertise: [],
      photoUrl: '',
      joinDate: todayISO(),
      reportsToId: lead?.id ?? null,
      status: 'Active',
      email: '',
      phone: '',
      bio: '',
      ...prefill,
    };
  }

  useEffect(() => {
    if (open) {
      setDraft(editing ? { ...editing } : emptyDraft());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = 'Name is required';
    if (!draft.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(draft.email))
      errs.email = 'Enter a valid email';
    if (!draft.city.trim()) errs.city = 'City is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editing) {
      updateTeamMember(editing.id, draft);
      toast.success('Team member updated', draft.name);
    } else {
      addTeamMember(draft);
      toast.success('Team member added', `${draft.name} joined the desk`);
    }
    onClose();
  };

  const reportOptions = data.teamMembers
    .filter((m) => m.id !== editing?.id)
    .map((m) => ({ value: m.id, label: `${m.name} · ${m.role}` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title={editing ? 'Edit Team Member' : 'Add Team Member'}
      subtitle="Equity research desk profile"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add member'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
          <Avatar name={draft.name || 'New Member'} src={draft.photoUrl} size="lg" />
          <div className="flex-1">
            <Field label="Photo URL" hint="Leave blank to use auto-generated initials">
              <TextInput
                value={draft.photoUrl}
                onChange={(e) => set({ photoUrl: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name}>
            <TextInput
              value={draft.name}
              invalid={!!errors.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Aarav Mehta"
            />
          </Field>
          <Field label="Role" required>
            <Select
              value={draft.role}
              onChange={(v) => set({ role: v as TeamMember['role'] })}
              options={toOptions(TEAM_ROLES)}
            />
          </Field>
          <Field label="City" required error={errors.city}>
            <TextInput
              value={draft.city}
              invalid={!!errors.city}
              onChange={(e) => set({ city: e.target.value })}
              placeholder="e.g. Mumbai"
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v as TeamMember['status'] })}
              options={toOptions(MEMBER_STATUSES)}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <TextInput
              type="email"
              value={draft.email}
              invalid={!!errors.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="name@munshot.com"
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={draft.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+91 …"
            />
          </Field>
          <Field label="Qualification">
            <TextInput
              value={draft.qualification}
              onChange={(e) => set({ qualification: e.target.value })}
              placeholder="e.g. CFA Level II Candidate"
            />
          </Field>
          <Field label="Join date">
            <TextInput
              type="date"
              value={draft.joinDate}
              onChange={(e) => set({ joinDate: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Reports to">
          <Select
            value={draft.reportsToId ?? ''}
            onChange={(v) => set({ reportsToId: v || null })}
            options={reportOptions}
            placeholder="No manager (founder)"
          />
        </Field>

        <Field label="Expertise" hint="Press Enter to add each area">
          <TagInput
            value={draft.expertise}
            onChange={(v) => set({ expertise: v })}
            placeholder="e.g. Banking & NBFC"
          />
        </Field>

        <Field label="Bio">
          <TextArea
            value={draft.bio}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder="Short description of focus areas and strengths…"
          />
        </Field>
      </div>
    </Modal>
  );
}
