import React, { useMemo, useState } from 'react';
import {
  CalendarHeart,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Gift,
  Home,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  GuestTag,
  HouseholdDraft,
  HouseholdInvitation,
  HouseholdMember,
  RsvpStatus,
  WeddingConfig,
} from '../../types/wedding';
import { sendOrShareWhatsAppWithPdf, type InvitationVariant } from '../../utils/invitations';
import { exportGuestsToCsv } from '../../utils/storage';
import { Button, EmptyState, Field, Modal, Toggle, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

interface HouseholdManagerProps {
  config?: WeddingConfig;
  households: HouseholdInvitation[];
  selectedIds: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onCreate: (draft: HouseholdDraft) => Promise<void>;
  onUpdate: (id: string, updates: Partial<HouseholdInvitation>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreview: (household: HouseholdInvitation, variant: InvitationVariant) => void;
  onOpenReport?: () => void;
  notify: (toast: ToastState) => void;
}

interface HouseholdFormState {
  name: string;
  email: string;
  phone: string;
  partySize: number;
  rsvpStatus: RsvpStatus;
  attendingCount: number;
  tableNumber: string;
  isPlusOneAllowed: boolean;
  tags: GuestTag[];
  members: MemberFormState[];
}

interface MemberFormState extends HouseholdMember {
  formKey: string;
}

const makeMemberFormState = (member?: Partial<HouseholdMember>): MemberFormState => ({
  id: member?.id || '',
  householdId: member?.householdId || '',
  name: member?.name || '',
  email: member?.email || '',
  phone: member?.phone || '',
  isPrimary: member?.isPrimary ?? false,
  isInvited: member?.isInvited ?? true,
  attending: member?.attending ?? null,
  mealSelection: member?.mealSelection,
  dietaryRestrictions: member?.dietaryRestrictions || [],
  dietaryDetails: member?.dietaryDetails,
  createdAt: member?.createdAt,
  updatedAt: member?.updatedAt,
  formKey: member?.id || `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
});

const makeEmptyForm = (): HouseholdFormState => ({
  name: '',
  email: '',
  phone: '',
  partySize: 1,
  rsvpStatus: 'pending',
  attendingCount: 0,
  tableNumber: '',
  isPlusOneAllowed: false,
  tags: [],
  members: [makeMemberFormState({ isPrimary: true })],
});

const formFromHousehold = (household: HouseholdInvitation): HouseholdFormState => {
  const members = [...(household.members || [])]
    .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
    .map(makeMemberFormState);

  return {
    name: household.name,
    email: household.email || '',
    phone: household.phone || '',
    partySize: Math.max(household.partySize, members.length || 1),
    rsvpStatus: household.rsvpStatus,
    attendingCount: household.attendingCount,
    tableNumber: household.tableNumber || '',
    isPlusOneAllowed: household.isPlusOneAllowed,
    tags: household.tags || [],
    members: members.length ? members : [makeMemberFormState({ householdId: household.id, isPrimary: true })],
  };
};

const tagLabel: Record<GuestTag, string> = {
  free_venue_housing: 'Venue stay provided',
  presence_is_our_gift: 'Presence is the gift',
};

const statusStyles: Record<RsvpStatus, string> = {
  attending: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-stone-200 bg-stone-100 text-stone-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({
  config,
  households,
  selectedIds,
  onSelectionChange,
  onCreate,
  onUpdate,
  onDelete,
  onPreview,
  onOpenReport,
  notify,
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | RsvpStatus>('all');
  const [tag, setTag] = useState<'all' | GuestTag>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HouseholdInvitation | null>(null);
  const [form, setForm] = useState<HouseholdFormState>(makeEmptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households.filter(household => {
      const matchesQuery = !query || [household.name, household.email, household.phone, household.inviteCode]
        .some(value => value?.toLowerCase().includes(query))
        || household.members.some(member => [member.name, member.email, member.phone]
          .some(value => value?.toLowerCase().includes(query)));
      const matchesStatus = status === 'all' || household.rsvpStatus === status;
      const matchesTag = tag === 'all' || household.tags.includes(tag);
      return matchesQuery && matchesStatus && matchesTag;
    });
  }, [households, search, status, tag]);

  const openNew = () => {
    setEditing(null);
    setForm(makeEmptyForm());
    setEditorOpen(true);
  };

  const openEdit = (household: HouseholdInvitation) => {
    setEditing(household);
    setForm(formFromHousehold(household));
    setEditorOpen(true);
  };

  const toggleTag = (value: GuestTag, checked: boolean) => {
    setForm(current => ({
      ...current,
      tags: checked ? [...new Set([...current.tags, value])] : current.tags.filter(item => item !== value),
    }));
  };

  const updateMember = (formKey: string, updates: Partial<MemberFormState>) => {
    setForm(current => ({
      ...current,
      members: current.members.map(member => member.formKey === formKey ? { ...member, ...updates } : member),
    }));
  };

  const addMember = () => {
    setForm(current => {
      if (current.members.length >= 20) return current;
      const members = [...current.members, makeMemberFormState()];
      return { ...current, members, partySize: Math.max(current.partySize, members.length) };
    });
  };

  const removeMember = (formKey: string) => {
    const member = form.members.find(item => item.formKey === formKey);
    if (!member || form.members.length <= 1) return;
    if (member.id && !window.confirm(`Remove ${member.name || 'this person'} from the invitation? Their saved RSVP details will be deleted when you save the household.`)) return;
    setForm(current => {
      const members = current.members.filter(member => member.formKey !== formKey);
      return {
        ...current,
        members: members.map((member, index) => ({ ...member, isPrimary: index === 0 })),
      };
    });
  };

  const makeMembers = (householdId: string): HouseholdMember[] => form.members
    .filter(member => member.name.trim())
    .map(({ formKey: _formKey, ...member }, index) => ({
      ...member,
      id: member.id || '',
      householdId: member.householdId || householdId,
      name: member.name.trim(),
      email: member.email?.trim() || undefined,
      phone: member.phone?.trim() || undefined,
      isPrimary: index === 0,
    }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const namedMembers = form.members.filter(member => member.name.trim());
    if (namedMembers.length === 0) {
      notify({ tone: 'error', message: 'Add at least one invited person before saving this household.' });
      return;
    }
    const partySize = Math.max(form.partySize, namedMembers.length);
    const attendingCount = Math.min(Math.max(0, form.attendingCount), partySize);
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          partySize,
          rsvpStatus: form.rsvpStatus,
          attendingCount: form.rsvpStatus === 'attending' ? attendingCount : 0,
          tableNumber: form.tableNumber.trim() || undefined,
          isPlusOneAllowed: form.isPlusOneAllowed,
          tags: form.tags,
          members: makeMembers(editing.id),
        });
        notify({ tone: 'success', message: `${form.name.trim()} was updated.` });
      } else {
        await onCreate({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          partySize,
          tableNumber: form.tableNumber.trim() || undefined,
          isPlusOneAllowed: form.isPlusOneAllowed,
          tags: form.tags,
          members: makeMembers(''),
        });
        notify({ tone: 'success', message: `${form.name.trim()} was added and received a private invite code.` });
      }
      setEditorOpen(false);
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'The household could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAllVisible = () => {
    const allVisibleSelected = filtered.length > 0 && filtered.every(household => selectedIds.has(household.id));
    const next = new Set(selectedIds);
    filtered.forEach(household => allVisibleSelected ? next.delete(household.id) : next.add(household.id));
    onSelectionChange(next);
  };

  const copyInvitation = async (household: HouseholdInvitation) => {
    const url = household.invitationUrl || `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(household.inviteCode)}#rsvp`;
    try {
      await navigator.clipboard.writeText(url);
      notify({ tone: 'success', message: `Private invitation link copied for ${household.name}.` });
    } catch {
      notify({ tone: 'error', message: 'Clipboard access was blocked by the browser.' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Guest administration</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-900">Households &amp; invitees</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">One private invitation per household. Add individual members, contact details and access tags without exposing bearer invite codes publicly.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <Button onClick={onOpenReport} title="Open Complete Master Wedding Report">
              <FileSpreadsheet className="h-4 w-4 text-[#8a2947]" /> Master Report
            </Button>
          )}
          <Button onClick={() => exportGuestsToCsv(households)} disabled={!households.length} title="Download CSV of all guests and RSVP details">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button tone="primary" onClick={openNew}><Plus className="h-4 w-4" /> Add household</Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-[minmax(220px,1fr)_170px_190px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search household, contact or code" className={`${inputClass} pl-9`} />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value as 'all' | RsvpStatus)} className={inputClass}>
          <option value="all">All RSVP states</option>
          <option value="pending">Pending</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
        </select>
        <select value={tag} onChange={event => setTag(event.target.value as 'all' | GuestTag)} className={inputClass}>
          <option value="all">All access tags</option>
          <option value="free_venue_housing">Venue housing</option>
          <option value="presence_is_our_gift">No gifts</option>
        </select>
        <Button onClick={toggleAllVisible}>{filtered.every(item => selectedIds.has(item.id)) && filtered.length ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />} Select visible</Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-[#d9b2be] bg-[#fff5f8] px-4 py-3 text-xs text-[#713047]">
          <span><strong>{selectedIds.size}</strong> household{selectedIds.size === 1 ? '' : 's'} ready for invitation delivery.</span>
          <button type="button" onClick={() => onSelectionChange(new Set())} className="font-semibold underline">Clear selection</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={households.length ? 'No households match these filters' : 'Your guest list is ready to be built'}
          description={households.length ? 'Try a broader search or clear a filter.' : 'Add the first household, then include each invited person and the right housing or gift access tags.'}
          action={!households.length ? <Button tone="primary" onClick={openNew}><Plus className="h-4 w-4" /> Add first household</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[44px_minmax(190px,1.35fr)_minmax(150px,1fr)_120px_minmax(170px,1fr)_180px] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400 lg:grid">
            <span /> <span>Household</span><span>Contact</span><span>RSVP</span><span>Access</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-stone-100">
            {filtered.map(household => (
              <div key={household.id} className={`grid gap-4 px-4 py-4 transition lg:grid-cols-[44px_minmax(190px,1.35fr)_minmax(150px,1fr)_120px_minmax(170px,1fr)_180px] lg:items-center lg:gap-3 ${selectedIds.has(household.id) ? 'bg-[#fff8fa]' : 'hover:bg-stone-50/70'}`}>
                <label className="flex items-center gap-2 lg:block">
                  <input type="checkbox" checked={selectedIds.has(household.id)} onChange={() => toggleSelected(household.id)} className="h-4 w-4 rounded border-stone-300 text-[#8a2947] focus:ring-[#bd7890]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 lg:hidden">Select for sending</span>
                </label>
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-semibold text-stone-900">{household.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
                    <span>{household.members.length || household.partySize} member{(household.members.length || household.partySize) === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span className="font-mono" title="Private bearer code">••••••{household.inviteCode.slice(-6)}</span>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-stone-600">
                  {household.email ? <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-stone-400" /> {household.email}</p> : <p className="text-amber-600">Email missing</p>}
                  {household.phone ? <p className="truncate">{household.phone}</p> : <p className="text-stone-400">Phone missing</p>}
                </div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyles[household.rsvpStatus]}`}>{household.rsvpStatus}</span>
                  {household.rsvpStatus === 'attending' && <p className="mt-1 text-[10px] text-stone-500">{household.attendingCount} / {household.partySize} attending</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {household.tags.length ? household.tags.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[9px] font-semibold text-stone-600">
                      {item === 'free_venue_housing' ? <Home className="h-3 w-3" /> : <Gift className="h-3 w-3" />} {tagLabel[item]}
                    </span>
                  )) : <span className="text-[10px] text-stone-400">Standard access</span>}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-1.5 lg:justify-end">
                  {config && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await sendOrShareWhatsAppWithPdf(config, {
                            id: household.id,
                            name: household.name,
                            inviteCode: household.inviteCode,
                            phone: household.phone,
                            email: household.email,
                          }, 'official');
                          if (res.method === 'native-share') {
                            notify({ tone: 'success', message: `Shared invitation & PDF for ${household.name}!` });
                          } else {
                            notify({ tone: 'success', message: `Generated ${household.name}'s 5×7 PDF & opened WhatsApp!` });
                          }
                        } catch (err) {
                          notify({ tone: 'error', message: 'PDF generation failed.' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                      title={`Generate PDF and send invitation to ${household.name} on WhatsApp`}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <Button size="sm" onClick={() => copyInvitation(household)} title="Copy private invitation link"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" onClick={() => onPreview(household, 'official')} title="Preview official invitation"><CalendarHeart className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" onClick={() => openEdit(household)} title="Edit household"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" tone="danger" onClick={async () => {
                    if (!window.confirm(`Remove ${household.name}? This also removes its private RSVP access.`)) return;
                    try {
                      await onDelete(household.id);
                      notify({ tone: 'success', message: `${household.name} was removed.` });
                    } catch (error) {
                      notify({ tone: 'error', message: error instanceof Error ? error.message : 'The household could not be removed.' });
                    }
                  }} title="Delete household"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? 'Edit household' : 'Add household'} eyebrow="Private invitation record" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Household / invitation name" className="sm:col-span-2">
              <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="The Daniels family" className={inputClass} />
            </Field>
            <Field label="Primary email"><input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="guest@example.com" className={inputClass} /></Field>
            <Field label="Mobile / WhatsApp"><input type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="+27 …" className={inputClass} /></Field>
            <Field label="Maximum party size"><input type="number" min={form.members.length} max={20} value={form.partySize} onChange={event => setForm(current => ({ ...current, partySize: Math.max(current.members.length, Number(event.target.value) || current.members.length) }))} className={inputClass} /></Field>
            <Field label="Table / seating note"><input value={form.tableNumber} onChange={event => setForm(current => ({ ...current, tableNumber: event.target.value }))} placeholder="Unassigned" className={inputClass} /></Field>
            {editing && (
              <>
                <Field label="RSVP status">
                  <select value={form.rsvpStatus} onChange={event => setForm(current => ({ ...current, rsvpStatus: event.target.value as RsvpStatus }))} className={inputClass}>
                    <option value="pending">Pending</option><option value="attending">Attending</option><option value="declined">Declined</option>
                  </select>
                </Field>
                <Field label="Attending count"><input type="number" min={0} max={form.partySize} value={form.attendingCount} disabled={form.rsvpStatus !== 'attending'} onChange={event => setForm(current => ({ ...current, attendingCount: Number(event.target.value) }))} className={inputClass} /></Field>
              </>
            )}
          </div>

          <fieldset className="space-y-3" aria-describedby="invitee-help">
            <legend className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Invited people</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p id="invitee-help" className="text-[10px] leading-relaxed text-stone-400">The first person is the primary invitee. Their RSVP answers and existing record are preserved when you edit their contact details.</p>
              </div>
              <Button size="sm" onClick={addMember} disabled={form.members.length >= 20} title={form.members.length >= 20 ? 'A household can include up to 20 people' : 'Add another invited person'}><Plus className="h-3.5 w-3.5" /> Add person</Button>
            </div>

            <div className="space-y-3">
              {form.members.map((member, index) => {
                const inputPrefix = `household-member-${member.formKey}`;
                return (
                  <div key={member.formKey} className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-stone-800">Person {index + 1}{index === 0 ? ' · Primary' : ''}</p>
                        {member.attending !== null && editing && (
                          <p className="mt-0.5 text-[10px] text-stone-400">Current RSVP: {member.attending ? 'Attending' : 'Not attending'}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        tone="danger"
                        onClick={() => removeMember(member.formKey)}
                        disabled={form.members.length === 1}
                        aria-label={`Remove person ${index + 1}${member.name.trim() ? `, ${member.name.trim()}` : ''}`}
                        title={form.members.length === 1 ? 'Every household needs at least one invited person' : 'Remove this invited person'}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor={`${inputPrefix}-name`} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Full name</label>
                        <input
                          id={`${inputPrefix}-name`}
                          required
                          autoComplete="name"
                          value={member.name}
                          onChange={event => updateMember(member.formKey, { name: event.target.value })}
                          placeholder="Guest's full name"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${inputPrefix}-email`} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Email</label>
                        <input
                          id={`${inputPrefix}-email`}
                          type="email"
                          autoComplete="email"
                          value={member.email || ''}
                          onChange={event => updateMember(member.formKey, { email: event.target.value })}
                          placeholder="Email address"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${inputPrefix}-phone`} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Mobile / WhatsApp</label>
                        <input
                          id={`${inputPrefix}-phone`}
                          type="tel"
                          autoComplete="tel"
                          value={member.phone || ''}
                          onChange={event => updateMember(member.formKey, { phone: event.target.value })}
                          placeholder="Phone number"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Access rules</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={form.tags.includes('free_venue_housing')} onChange={checked => toggleTag('free_venue_housing', checked)} label="Free venue housing" description="Shows only the provided on-site stay; hides paid accommodation alternatives." />
              <Toggle checked={form.tags.includes('presence_is_our_gift')} onChange={checked => toggleTag('presence_is_our_gift', checked)} label="Presence is our gift" description="Replaces the registry with the couple's personal no-gift message." />
              <Toggle checked={form.isPlusOneAllowed} onChange={checked => setForm(current => ({ ...current, isPlusOneAllowed: checked }))} label="Flexible plus-one" description="Allows an unnamed companion within the maximum party size." />
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] leading-relaxed text-emerald-800">
                <ShieldCheck className="mb-1.5 h-4 w-4" /> A unique high-entropy invite code is generated by the backend and never entered manually.
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end">
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save household' : 'Create private invitation'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
