import React, { useMemo, useState } from 'react';
import {
  CalendarHeart,
  Check,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
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
import { exportGuestsToCsv, formatInviteCodeDisplay, generateHouseholdInviteCode } from '../../utils/storage';
import {
  WEDDING_ROLE_TAGS,
  ACCESS_TAG_DEFS,
  getTagMeta,
  isWeddingRoleTag,
} from '../../utils/guestTags';
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
  inviteCode: string;
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
  role: member?.role,
  createdAt: member?.createdAt,
  updatedAt: member?.updatedAt,
  formKey: member?.id || `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
});

const makeEmptyForm = (): HouseholdFormState => ({
  name: '',
  inviteCode: '',
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
    inviteCode: household.inviteCode || '',
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

const SUPABASE_SETUP_SQL = `-- Supabase 1-Click Setup: Short Invite Codes (e.g. Anr-658) & Full VIP Roles
-- Paste this into your Supabase SQL Editor (Dashboard -> SQL Editor -> New query) and click Run

-- 1. Drop check constraint so all VIP roles (maid_of_honor, bridesmaid, best_man, etc.) save cleanly
alter table public.households drop constraint if exists households_allowed_tags;

-- 2. Update lookup_invitation to support custom short codes (e.g. Anr-658, Cam-101)
create or replace function public.lookup_invitation(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_id uuid;
  clean_token text;
begin
  if raw_token is null or char_length(trim(raw_token)) < 2 then
    return null;
  end if;

  clean_token := upper(regexp_replace(raw_token, '[^a-zA-Z0-9]', '', 'g'));

  select id into household_id
  from public.households
  where upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = clean_token
     or upper(trim(invite_code)) = upper(trim(raw_token))
     or upper(regexp_replace(regexp_replace(invite_code, '^CA-', '', 'i'), '[^a-zA-Z0-9]', '', 'g')) = clean_token
     or upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = upper(regexp_replace(regexp_replace(raw_token, '^CA-', '', 'i'), '[^a-zA-Z0-9]', '', 'g'))
  limit 1;

  if household_id is null then
    return null;
  end if;

  return public.invitation_bundle(household_id);
end;
$$;

-- 3. Update submit_household_rsvp to support short codes and case-insensitive matching
create or replace function public.submit_household_rsvp(raw_token text, response jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_row public.households%rowtype;
  member_payload jsonb;
  member_id_text text;
  member_attending boolean;
  response_status text;
  response_count integer;
  response_members jsonb;
  restrictions text[];
  invited_member_count integer;
  submitted_attending_count integer := 0;
  submitted_new_count integer := 0;
  persisted_attending_count integer;
  submitted_member_ids uuid[] := '{}'::uuid[];
  clean_token text;
begin
  if raw_token is null or char_length(trim(raw_token)) < 2 then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if response is null or jsonb_typeof(response) <> 'object' then
    raise exception 'Invalid RSVP response' using errcode = '22023';
  end if;

  clean_token := upper(regexp_replace(raw_token, '[^a-zA-Z0-9]', '', 'g'));

  select * into household_row
  from public.households
  where upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = clean_token
     or upper(trim(invite_code)) = upper(trim(raw_token))
     or upper(regexp_replace(regexp_replace(invite_code, '^CA-', '', 'i'), '[^a-zA-Z0-9]', '', 'g')) = clean_token
     or upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = upper(regexp_replace(regexp_replace(raw_token, '^CA-', '', 'i'), '[^a-zA-Z0-9]', '', 'g'))
  for update;

  if household_row.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  response_status := response ->> 'rsvpStatus';
  if response_status not in ('attending', 'declined') then
    raise exception 'Invalid RSVP status' using errcode = '22023';
  end if;

  select count(*) into invited_member_count
  from public.household_members
  where household_id = household_row.id;

  response_members := coalesce(response -> 'members', '[]'::jsonb);
  if jsonb_typeof(response_members) <> 'array' then
    raise exception 'Invalid members list' using errcode = '22023';
  end if;

  if jsonb_array_length(response_members) > 0 then
    for member_payload in select * from jsonb_array_elements(response_members) loop
      member_id_text := member_payload ->> 'id';
      member_attending := coalesce((member_payload ->> 'attending')::boolean, false);
      restrictions := public.jsonb_text_array_or_empty(member_payload -> 'dietaryRestrictions');

      if member_id_text is not null and member_id_text <> '' then
        update public.household_members
        set
          attending = member_attending,
          dietary_restrictions = restrictions,
          dietary_details = nullif(trim(member_payload ->> 'dietaryDetails'), ''),
          meal_selection = nullif(trim(member_payload ->> 'mealSelection'), ''),
          updated_at = timezone('utc', now())
        where id = member_id_text::uuid
          and household_id = household_row.id;

        submitted_member_ids := array_append(submitted_member_ids, member_id_text::uuid);
        if member_attending then
          submitted_attending_count := submitted_attending_count + 1;
        end if;
      elsif household_row.is_plus_one_allowed and coalesce(trim(member_payload ->> 'name'), '') <> '' then
        insert into public.household_members (
          household_id,
          name,
          is_primary,
          is_invited,
          attending,
          dietary_restrictions,
          dietary_details,
          meal_selection
        ) values (
          household_row.id,
          trim(member_payload ->> 'name'),
          false,
          false,
          member_attending,
          restrictions,
          nullif(trim(member_payload ->> 'dietaryDetails'), ''),
          nullif(trim(member_payload ->> 'mealSelection'), '')
        );

        submitted_new_count := submitted_new_count + 1;
        if member_attending then
          submitted_attending_count := submitted_attending_count + 1;
        end if;
      end if;
    end loop;
  end if;

  if response_status = 'declined' then
    update public.household_members
    set attending = false, updated_at = timezone('utc', now())
    where household_id = household_row.id;
    persisted_attending_count := 0;
  else
    select count(*) into persisted_attending_count
    from public.household_members
    where household_id = household_row.id and attending is true;

    if persisted_attending_count = 0 then
      response_count := coalesce((response ->> 'attendingCount')::integer, 0);
      persisted_attending_count := greatest(0, least(response_count, household_row.max_party_size));
    end if;
  end if;

  update public.households
  set
    rsvp_status = response_status,
    attending_count = persisted_attending_count,
    email = coalesce(nullif(trim(response ->> 'email'), ''), household_row.email),
    phone = coalesce(nullif(trim(response ->> 'phone'), ''), household_row.phone),
    meal_selection = coalesce(nullif(trim(response ->> 'mealSelection'), ''), household_row.meal_selection),
    dietary_restrictions = coalesce(public.jsonb_text_array_or_empty(response -> 'dietaryRestrictions'), household_row.dietary_restrictions),
    dietary_details = coalesce(nullif(trim(response ->> 'dietaryDetails'), ''), household_row.dietary_details),
    song_request = coalesce(nullif(trim(response ->> 'songRequest'), ''), household_row.song_request),
    message = coalesce(nullif(trim(response ->> 'message'), ''), household_row.message),
    table_number = case
      when response_status = 'declined' then null
      else coalesce(nullif(trim(response ->> 'tableNumber'), ''), household_row.table_number)
    end,
    updated_at = timezone('utc', now())
  where id = household_row.id;

  return public.invitation_bundle(household_row.id);
end;
$$;

-- 4. Grant execute permissions
grant execute on function public.lookup_invitation(text) to anon, authenticated;
grant execute on function public.submit_household_rsvp(text, jsonb) to anon, authenticated;

-- 5. Upgrade any legacy CA- codes to short format
update public.households
set invite_code = initcap(substring(regexp_replace(coalesce(display_name, 'Wed'), '[^a-zA-Z]', '', 'g') from 1 for 3)) || '-' || lpad(floor(100 + random() * 900)::text, 3, '0')
where invite_code like 'CA-%' or char_length(invite_code) > 10;
`;

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
  const [tag, setTag] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HouseholdInvitation | null>(null);

  const copySupabaseSql = () => {
    void navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    notify({
      tone: 'success',
      message: 'Copied complete Supabase SQL setup to clipboard! Paste into your Supabase SQL Editor and click Run.',
    });
  };
  const [form, setForm] = useState<HouseholdFormState>(makeEmptyForm);
  const [customTagInput, setCustomTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households.filter(household => {
      const matchesQuery = !query || [household.name, household.email, household.phone, household.inviteCode]
        .some(value => value?.toLowerCase().includes(query))
        || household.members.some(member => [member.name, member.email, member.phone]
          .some(value => value?.toLowerCase().includes(query)));
      const matchesStatus = status === 'all' || household.rsvpStatus === status;
      const matchesTag = tag === 'all' || household.tags.includes(tag as GuestTag);
      return matchesQuery && matchesStatus && matchesTag;
    });
  }, [households, search, status, tag]);

  const [isCodeCustomized, setIsCodeCustomized] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(makeEmptyForm());
    setIsCodeCustomized(false);
    setCustomTagInput('');
    setEditorOpen(true);
  };

  const openEdit = (household: HouseholdInvitation) => {
    setEditing(household);
    setForm(formFromHousehold(household));
    setIsCodeCustomized(true);
    setCustomTagInput('');
    setEditorOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm(current => {
      const shouldAuto = !editing && !isCodeCustomized;
      const code = shouldAuto
        ? generateHouseholdInviteCode(name, households.map(h => h.inviteCode))
        : current.inviteCode;
      return {
        ...current,
        name,
        inviteCode: code,
      };
    });
  };

  const hasLegacyCodes = useMemo(() => {
    return households.some(h => h.inviteCode?.startsWith('CA-') || (h.inviteCode && h.inviteCode.length > 10));
  }, [households]);

  const handleReformatAllLegacyCodes = async () => {
    if (!window.confirm('Update all households with legacy/long invite codes to the custom format (e.g. Anr-658)?')) return;
    setSaving(true);
    try {
      let count = 0;
      const existing = households.map(h => h.inviteCode);
      for (const h of households) {
        if (h.inviteCode?.startsWith('CA-') || (h.inviteCode && h.inviteCode.length > 10)) {
          const newCode = generateHouseholdInviteCode(h.name, existing);
          existing.push(newCode);
          await onUpdate(h.id, { inviteCode: newCode });
          count++;
        }
      }
      notify({ tone: 'success', message: `Updated ${count} household invite code${count === 1 ? '' : 's'} to custom format (e.g. Anr-658)!` });
    } catch {
      notify({ tone: 'error', message: 'Failed to update some legacy invite codes.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (value: GuestTag, checked: boolean) => {
    setForm(current => {
      const nextTags = checked
        ? [...new Set([...current.tags, value])]
        : current.tags.filter(item => item !== value);

      let nextMembers = current.members;
      if (!checked) {
        nextMembers = current.members.map(m => m.role === value ? { ...m, role: undefined } : m);
      } else if (current.members.length === 1 && !current.members[0].role && isWeddingRoleTag(value)) {
        nextMembers = [{ ...current.members[0], role: value }];
      }

      return {
        ...current,
        tags: nextTags,
        members: nextMembers,
      };
    });
  };

  const handleMemberRoleChange = (formKey: string, newRole: string) => {
    setForm(current => {
      const oldMember = current.members.find(m => m.formKey === formKey);
      const oldRole = oldMember?.role;
      const updatedMembers = current.members.map(m => m.formKey === formKey ? { ...m, role: newRole || undefined } : m);

      let nextTags = [...current.tags];
      if (oldRole && isWeddingRoleTag(oldRole)) {
        const stillInUse = updatedMembers.some(m => m.role === oldRole);
        if (!stillInUse) {
          nextTags = nextTags.filter(t => t !== oldRole);
        }
      }
      if (newRole && !nextTags.includes(newRole as GuestTag)) {
        nextTags.push(newRole as GuestTag);
      }

      return {
        ...current,
        members: updatedMembers,
        tags: nextTags,
      };
    });
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clean) return;
    if (!form.tags.includes(clean as GuestTag)) {
      setForm(current => ({
        ...current,
        tags: [...current.tags, clean as GuestTag],
      }));
    }
    setCustomTagInput('');
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
      role: member.role || undefined,
    }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const namedMembers = form.members.filter(member => member.name.trim());
    if (namedMembers.length === 0) {
      notify({ tone: 'error', message: 'Add at least one invited person before saving this household.' });
      return;
    }
    const partySize = Math.max(form.partySize, namedMembers.length + (form.isPlusOneAllowed ? 1 : 0));
    const attendingCount = Math.min(Math.max(0, form.attendingCount), partySize);
    const existingCodes = households.map(h => h.inviteCode);
    const inviteCode = form.inviteCode.trim()
      ? formatInviteCodeDisplay(form.inviteCode, form.name)
      : generateHouseholdInviteCode(form.name, existingCodes);
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: form.name.trim(),
          inviteCode,
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
          inviteCode,
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
          {hasLegacyCodes && (
            <Button onClick={handleReformatAllLegacyCodes} disabled={saving} title="Upgrade all legacy codes to custom format (e.g. Anr-658)">
              <Sparkles className="h-4 w-4 text-pink-600" /> Reformat Legacy Codes
            </Button>
          )}
          <Button onClick={() => exportGuestsToCsv(households)} disabled={!households.length} title="Download CSV of all guests and RSVP details">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={copySupabaseSql} title="Copy SQL for Supabase SQL Editor to enable short codes (e.g. Anr-658) and direct RSVP saving in Supabase">
            <Database className="h-4 w-4 text-emerald-600" /> Supabase SQL
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
        <select value={tag} onChange={event => setTag(event.target.value)} className={inputClass}>
          <option value="all">All tags &amp; roles</option>
          <optgroup label="Wedding Party &amp; VIP Roles">
            {WEDDING_ROLE_TAGS.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </optgroup>
          <optgroup label="Access Rules">
            {ACCESS_TAG_DEFS.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </optgroup>
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
            <span /> <span>Household</span><span>Contact</span><span>RSVP</span><span>Tags &amp; Roles</span><span className="text-right">Actions</span>
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
                    <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-stone-700" title="Household invite code">
                      {formatInviteCodeDisplay(household.inviteCode, household.name)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const code = formatInviteCodeDisplay(household.inviteCode, household.name);
                          void navigator.clipboard.writeText(code);
                          notify({ tone: 'success', message: `Copied code ${code} to clipboard!` });
                        }}
                        className="ml-0.5 text-stone-400 hover:text-stone-700"
                        title="Copy invite code"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </span>
                    {(household.inviteCode?.startsWith('CA-') || (household.inviteCode && household.inviteCode.length > 10)) && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newCode = generateHouseholdInviteCode(household.name, households.map(h => h.inviteCode));
                          await onUpdate(household.id, { inviteCode: newCode });
                          notify({ tone: 'success', message: `Updated ${household.name}'s code to ${newCode}!` });
                        }}
                        className="text-[9px] font-bold text-pink-600 hover:underline"
                        title="Convert to custom format (e.g. Anr-658)"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                  {household.members && household.members.some(m => m.role) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {household.members.filter(m => m.role).map(m => {
                        const meta = getTagMeta(m.role!);
                        return (
                          <span
                            key={m.id || m.name}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            <span>{m.name}:</span>
                            <span>{meta.icon} {meta.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
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
                  {household.tags.length ? household.tags.map(item => {
                    const meta = getTagMeta(item);
                    return (
                      <span
                        key={item}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${meta.bg} ${meta.text} ${meta.border}`}
                        title={meta.description || meta.label}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                    );
                  }) : <span className="text-[10px] text-stone-400">Standard</span>}
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
                        } catch {
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
              <input
                required
                value={form.name}
                onChange={event => handleNameChange(event.target.value)}
                placeholder="Anri & Henk"
                className={inputClass}
              />
            </Field>
            <Field label="Primary email"><input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="guest@example.com" className={inputClass} /></Field>
            <Field label="Mobile / WhatsApp"><input type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="+27 …" className={inputClass} /></Field>
            <Field label="Invite code (e.g. Anr-658)">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={12}
                  value={form.inviteCode}
                  onChange={event => {
                    setIsCodeCustomized(true);
                    setForm(current => ({ ...current, inviteCode: event.target.value }));
                  }}
                  placeholder="Auto (e.g. Anr-658)"
                  className={`${inputClass} font-mono tracking-wider`}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsCodeCustomized(false);
                    const existingCodes = households.map(h => h.inviteCode);
                    const generated = generateHouseholdInviteCode(form.name, existingCodes);
                    setForm(current => ({ ...current, inviteCode: generated }));
                  }}
                  title="Generate custom short code from household name (e.g. Anr-658)"
                >
                  Generate
                </Button>
              </div>
            </Field>
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
                      <div className="sm:col-span-2">
                        <label htmlFor={`${inputPrefix}-role`} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                          Role / VIP Tag for {member.name.trim() || `Person ${index + 1}`}
                        </label>
                        <select
                          id={`${inputPrefix}-role`}
                          value={member.role || ''}
                          onChange={event => handleMemberRoleChange(member.formKey, event.target.value)}
                          className={inputClass}
                        >
                          <option value="">No special role (General guest)</option>
                          <optgroup label="Wedding Party">
                            <option value="maid_of_honor">💐 Maid of Honor</option>
                            <option value="bridesmaid">🌸 Bridesmaid</option>
                            <option value="best_man">👑 Best Man</option>
                            <option value="groomsman">🤵 Groomsman</option>
                            <option value="flower_girl">🌺 Flower Girl</option>
                            <option value="ring_bearer">💍 Ring Bearer</option>
                          </optgroup>
                          <optgroup label="Family & Honored VIPs">
                            <option value="mother_of_bride">🤍 Mother of the Bride</option>
                            <option value="father_of_bride">🤍 Father of the Bride</option>
                            <option value="mother_of_groom">🤍 Mother of the Groom</option>
                            <option value="father_of_groom">🤍 Father of the Groom</option>
                            <option value="master_of_ceremonies">🎤 Master of Ceremonies (MC)</option>
                            <option value="officiant">🕊️ Officiant</option>
                            <option value="vip">⭐ VIP Guest</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Wedding Party & VIP Roles */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Wedding Party &amp; VIP Roles</p>
                <p className="text-[11px] text-stone-500">Click to assign roles for key wedding members (bridesmaids, groomsmen, MC, flower girl, parents, etc.).</p>
              </div>
              <span className="text-[10px] font-medium text-stone-400">
                {form.tags.filter(isWeddingRoleTag).length} assigned
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {WEDDING_ROLE_TAGS.map(role => {
                const isActive = form.tags.includes(role.id as GuestTag);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleTag(role.id as GuestTag, !isActive)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 shadow-2xs ${
                      isActive
                        ? `${role.activeBg} ring-2 ring-stone-400/30 scale-[1.02]`
                        : `${role.bg} ${role.text} ${role.border} hover:opacity-100 hover:scale-[1.02] opacity-80`
                    }`}
                    title={role.description}
                  >
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                    {isActive ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="text-[10px] opacity-40">+</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="mt-3.5 border-t border-stone-200/80 pt-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Add custom role or tag (e.g. Reader, Musician, Cousin)…"
                    className={`${inputClass} pl-8.5 py-1.5 text-xs`}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomTag}
                  disabled={!customTagInput.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Tag
                </Button>
              </div>

              {/* Removable pills for custom tags */}
              {form.tags.some(t => !isWeddingRoleTag(t) && t !== 'free_venue_housing' && t !== 'presence_is_our_gift') && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">Custom tags:</span>
                  {form.tags
                    .filter(t => !isWeddingRoleTag(t) && t !== 'free_venue_housing' && t !== 'presence_is_our_gift')
                    .map(t => {
                      const meta = getTagMeta(t);
                      return (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-stone-700 shadow-2xs"
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                          <button
                            type="button"
                            onClick={() => toggleTag(t, false)}
                            className="ml-0.5 rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                            title="Remove tag"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                </div>
              )}

              {/* Supabase migration helper notice */}
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] text-stone-600">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>VIP roles and invite codes are backed up in Site Config. For direct Supabase table storage &amp; RSVP saving, run the SQL setup.</span>
                </span>
                <button
                  type="button"
                  onClick={copySupabaseSql}
                  className="shrink-0 font-mono text-[10px] font-bold text-[#8a2947] hover:underline"
                  title="Copy full SQL setup for Supabase SQL editor"
                >
                  Copy Supabase SQL
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Access rules</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={form.tags.includes('free_venue_housing')} onChange={checked => toggleTag('free_venue_housing', checked)} label="Free venue housing" description="Shows only the provided on-site stay; hides paid accommodation alternatives." />
              <Toggle checked={form.tags.includes('presence_is_our_gift')} onChange={checked => toggleTag('presence_is_our_gift', checked)} label="Presence is our gift" description="Replaces the registry with the couple's personal no-gift message." />
              <Toggle checked={form.isPlusOneAllowed} onChange={checked => setForm(current => ({ ...current, isPlusOneAllowed: checked }))} label="Flexible plus-one" description="Allows an unnamed companion within the maximum party size." />
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] leading-relaxed text-emerald-800">
                <ShieldCheck className="mb-1.5 h-4 w-4" /> A short, memorable invite code (household's first 3 letters + 2 random numbers) is automatically generated for cards and quick RSVP.
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
