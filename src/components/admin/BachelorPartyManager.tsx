import React, { useMemo, useState } from 'react';
import {
  Beer,
  Check,
  Compass,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

function generateAttendeeId(): string {
  return `attendee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateIdeaId(): string {
  return `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
import type {
  BachelorPartyAttendee,
  BachelorPartyConfig,
  BachelorPartyIdea,
  BachelorPartyIdeaCategory,
  HouseholdInvitation,
} from '../../types/wedding';
import { Button, EmptyState, Field, Modal, Toggle, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

interface BachelorPartyManagerProps {
  bachelorParty: BachelorPartyConfig;
  households: HouseholdInvitation[];
  onUpdate: (data: Partial<BachelorPartyConfig>) => Promise<void>;
  notify: (toast: ToastState) => void;
  onPreviewLive?: () => void;
}

const IDEA_CATEGORIES: Array<{ id: BachelorPartyIdeaCategory; label: string; icon: string }> = [
  { id: 'outdoor', label: 'Outdoor & Shooting', icon: '🎯' },
  { id: 'adventure', label: 'Adventure & Adrenaline', icon: '🏎️' },
  { id: 'weekend_trip', label: 'Weekend Getaway & Cabin', icon: '🏕️' },
  { id: 'braai_chill', label: 'Braai & Chill', icon: '🥩' },
  { id: 'sports', label: 'Golf & Sports', icon: '⛳' },
  { id: 'nightlife', label: 'Nightlife & Drinks', icon: '🍻' },
  { id: 'food_drinks', label: 'Steakhouse & Tasting', icon: '🥃' },
  { id: 'other', label: 'Other Activities', icon: '💡' },
];

export const BachelorPartyManager: React.FC<BachelorPartyManagerProps> = ({
  bachelorParty,
  households,
  onUpdate,
  notify,
  onPreviewLive,
}) => {
  const [activeTab, setActiveTab] = useState<'men' | 'ideas' | 'details'>('men');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<BachelorPartyAttendee | null>(null);
  const [attendeeForm, setAttendeeForm] = useState<Omit<BachelorPartyAttendee, 'id'>>({
    name: '',
    phone: '',
    email: '',
    relationship: 'Groomsman',
    notes: '',
    isConfirmed: true,
  });

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BachelorPartyIdea | null>(null);
  const [ideaForm, setIdeaForm] = useState<Omit<BachelorPartyIdea, 'id'>>({
    title: '',
    description: '',
    category: 'outdoor',
    estimatedCost: '',
    location: '',
    status: 'idea',
    votes: 1,
  });

  // Trip details form state
  const [detailsForm, setDetailsForm] = useState({
    title: bachelorParty.title,
    tagline: bachelorParty.tagline,
    dateOrWeekend: bachelorParty.dateOrWeekend,
    destination: bachelorParty.destination,
    budgetPerPerson: bachelorParty.budgetPerPerson || '',
    organizerNotes: bachelorParty.organizerNotes,
    groomNotes: bachelorParty.groomNotes,
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Attendees search filter
  const filteredAttendees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bachelorParty.attendees;
    return bachelorParty.attendees.filter(
      a => a.name.toLowerCase().includes(q) ||
           a.phone.toLowerCase().includes(q) ||
           (a.relationship && a.relationship.toLowerCase().includes(q)) ||
           (a.notes && a.notes.toLowerCase().includes(q)),
    );
  }, [bachelorParty.attendees, searchQuery]);

  // Candidates for quick import from guest list
  const importableCandidates = useMemo(() => {
    const existingNames = new Set(bachelorParty.attendees.map(a => a.name.trim().toLowerCase()));
    const candidates: Array<{
      name: string;
      phone: string;
      email: string;
      role: string;
      householdName: string;
    }> = [];

    households.forEach(h => {
      if (!existingNames.has(h.name.trim().toLowerCase())) {
        candidates.push({
          name: h.name,
          phone: h.phone || '',
          email: h.email || '',
          role: h.tags.includes('best_man') ? 'Best Man' : h.tags.includes('groomsman') ? 'Groomsman' : 'Wedding Guest',
          householdName: h.name,
        });
      }
      h.members.forEach(m => {
        if (!m.isPrimary && !existingNames.has(m.name.trim().toLowerCase())) {
          candidates.push({
            name: m.name,
            phone: m.phone || h.phone || '',
            email: m.email || h.email || '',
            role: m.role === 'best_man' ? 'Best Man' : m.role === 'groomsman' ? 'Groomsman' : 'Guest Member',
            householdName: h.name,
          });
        }
      });
    });

    return candidates;
  }, [bachelorParty.attendees, households]);

  const handleCopyAllNumbers = () => {
    const numbers = bachelorParty.attendees
      .map(a => a.phone.trim())
      .filter(Boolean);

    if (!numbers.length) {
      notify({ tone: 'error', message: 'No phone numbers to copy.' });
      return;
    }

    const text = numbers.join(', ');
    void navigator.clipboard.writeText(text);
    notify({ tone: 'success', message: `Copied ${numbers.length} phone numbers to clipboard!` });
  };

  const handleOpenAddAttendee = () => {
    setEditingAttendee(null);
    setAttendeeForm({
      name: '',
      phone: '',
      email: '',
      relationship: 'Groomsman',
      notes: '',
      isConfirmed: true,
    });
    setAttendeeModalOpen(true);
  };

  const handleOpenEditAttendee = (attendee: BachelorPartyAttendee) => {
    setEditingAttendee(attendee);
    setAttendeeForm({
      name: attendee.name,
      phone: attendee.phone,
      email: attendee.email || '',
      relationship: attendee.relationship || 'Groomsman',
      notes: attendee.notes || '',
      isConfirmed: attendee.isConfirmed ?? true,
    });
    setAttendeeModalOpen(true);
  };

  const handleSaveAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeForm.name.trim()) {
      notify({ tone: 'error', message: 'Please provide a name.' });
      return;
    }
    if (!attendeeForm.phone.trim()) {
      notify({ tone: 'error', message: 'Please provide a phone number.' });
      return;
    }

    try {
      let updatedAttendees: BachelorPartyAttendee[];
      if (editingAttendee) {
        updatedAttendees = bachelorParty.attendees.map(a =>
          a.id === editingAttendee.id
            ? { ...a, ...attendeeForm, name: attendeeForm.name.trim(), phone: attendeeForm.phone.trim() }
            : a,
        );
      } else {
        const newAttendee: BachelorPartyAttendee = {
          id: generateAttendeeId(),
          ...attendeeForm,
          name: attendeeForm.name.trim(),
          phone: attendeeForm.phone.trim(),
        };
        updatedAttendees = [...bachelorParty.attendees, newAttendee];
      }

      await onUpdate({ attendees: updatedAttendees });
      setAttendeeModalOpen(false);
      notify({
        tone: 'success',
        message: editingAttendee ? `Updated ${attendeeForm.name}` : `Added ${attendeeForm.name} to the bachelor party!`,
      });
    } catch {
      notify({ tone: 'error', message: 'Failed to save attendee.' });
    }
  };

  const handleDeleteAttendee = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the bachelor party roster?`)) return;
    try {
      const updated = bachelorParty.attendees.filter(a => a.id !== id);
      await onUpdate({ attendees: updated });
      notify({ tone: 'success', message: `Removed ${name}.` });
    } catch {
      notify({ tone: 'error', message: 'Failed to remove attendee.' });
    }
  };

  const handleImportCandidate = async (candidate: { name: string; phone: string; email?: string; role?: string }) => {
    try {
      const newAttendee: BachelorPartyAttendee = {
        id: generateAttendeeId(),
        name: candidate.name,
        phone: candidate.phone || '+27 ',
        email: candidate.email || '',
        relationship: candidate.role || 'Groomsman',
        notes: 'Imported from wedding guest list',
        isConfirmed: true,
      };
      await onUpdate({ attendees: [...bachelorParty.attendees, newAttendee] });
      notify({ tone: 'success', message: `Added ${candidate.name} to the bachelor party!` });
    } catch {
      notify({ tone: 'error', message: 'Failed to import guest.' });
    }
  };

  // Ideas management
  const handleOpenAddIdea = () => {
    setEditingIdea(null);
    setIdeaForm({
      title: '',
      description: '',
      category: 'outdoor',
      estimatedCost: '',
      location: '',
      status: 'idea',
      votes: 1,
    });
    setIdeaModalOpen(true);
  };

  const handleOpenEditIdea = (idea: BachelorPartyIdea) => {
    setEditingIdea(idea);
    setIdeaForm({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      estimatedCost: idea.estimatedCost || '',
      location: idea.location || '',
      status: idea.status,
      votes: idea.votes || 1,
    });
    setIdeaModalOpen(true);
  };

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaForm.title.trim()) {
      notify({ tone: 'error', message: 'Please provide a title for the activity.' });
      return;
    }

    try {
      let updatedIdeas: BachelorPartyIdea[];
      if (editingIdea) {
        updatedIdeas = bachelorParty.ideas.map(i =>
          i.id === editingIdea.id
            ? { ...i, ...ideaForm, title: ideaForm.title.trim(), description: ideaForm.description.trim() }
            : i,
        );
      } else {
        const newIdea: BachelorPartyIdea = {
          id: generateIdeaId(),
          ...ideaForm,
          title: ideaForm.title.trim(),
          description: ideaForm.description.trim(),
        };
        updatedIdeas = [newIdea, ...bachelorParty.ideas];
      }

      await onUpdate({ ideas: updatedIdeas });
      setIdeaModalOpen(false);
      notify({ tone: 'success', message: editingIdea ? 'Updated activity idea!' : 'Added new activity idea!' });
    } catch {
      notify({ tone: 'error', message: 'Failed to save activity idea.' });
    }
  };

  const handleDeleteIdea = async (id: string, title: string) => {
    if (!window.confirm(`Delete idea "${title}"?`)) return;
    try {
      const updated = bachelorParty.ideas.filter(i => i.id !== id);
      await onUpdate({ ideas: updated });
      notify({ tone: 'success', message: `Deleted "${title}".` });
    } catch {
      notify({ tone: 'error', message: 'Failed to delete idea.' });
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await onUpdate(detailsForm);
      notify({ tone: 'success', message: 'Saved bachelor party details & notes!' });
    } catch {
      notify({ tone: 'error', message: 'Failed to save trip details.' });
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with security notice */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1b382b] to-[#2c5340] text-amber-300 shadow-md">
              <Beer className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-stone-900">
                  Groom's Bachelor Party Hub
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <ShieldAlert className="h-3 w-3 text-emerald-600" />
                  Best Man &amp; Groomsmen Only
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Manage the men wanted at Cameron's bachelor party, their direct phone numbers, activities, and secret notes.
                Only guests tagged as <strong>Best Man</strong> or <strong>Groomsman</strong> can unlock and access this page.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              tone="secondary"
              onClick={handleCopyAllNumbers}
              title="Copy all phone numbers for WhatsApp group"
            >
              <Copy className="h-4 w-4 text-emerald-700" />
              Copy All Numbers
            </Button>
            {onPreviewLive && (
              <Button
                tone="primary"
                onClick={onPreviewLive}
                title="View the live bachelor page as seen by groomsmen"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Live Hub
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats pills */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">The Men Wanted</span>
            <p className="font-serif text-xl font-bold text-stone-900">{bachelorParty.attendees.length}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Activity Ideas</span>
            <p className="font-serif text-xl font-bold text-stone-900">{bachelorParty.ideas.length}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Target Window</span>
            <p className="truncate font-serif text-sm font-semibold text-stone-800">{bachelorParty.dateOrWeekend || 'TBC'}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Destination</span>
            <p className="truncate font-serif text-sm font-semibold text-stone-800">{bachelorParty.destination || 'TBC'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('men')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${activeTab === 'men' ? 'border-[#1b382b] text-[#1b382b]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          <Users className="h-4 w-4" />
          The Men &amp; Numbers ({bachelorParty.attendees.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${activeTab === 'ideas' ? 'border-[#1b382b] text-[#1b382b]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          <Compass className="h-4 w-4" />
          What to Do / Ideas ({bachelorParty.ideas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${activeTab === 'details' ? 'border-[#1b382b] text-[#1b382b]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          <MapPin className="h-4 w-4" />
          Trip Details &amp; Groom Notes
        </button>
      </div>

      {/* TAB 1: THE MEN & NUMBERS */}
      {activeTab === 'men' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search men by name, number, role..."
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button tone="secondary" onClick={() => setImportModalOpen(true)}>
                <UserPlus className="h-4 w-4 text-emerald-700" />
                Import from Guest List ({importableCandidates.length})
              </Button>
              <Button tone="primary" onClick={handleOpenAddAttendee}>
                <Plus className="h-4 w-4" />
                Add Person
              </Button>
            </div>
          </div>

          {filteredAttendees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No men added yet"
              description="Add the groomsmen, family, and close friends Cameron wants at his bachelor party."
              action={
                <Button tone="primary" onClick={handleOpenAddAttendee}>
                  <Plus className="h-4 w-4" /> Add First Person
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAttendees.map(person => {
                const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
                return (
                  <div
                    key={person.id}
                    className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-[#1b382b]/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base font-semibold text-stone-900">
                            {person.name}
                          </h3>
                          <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                            {person.relationship || 'Friend'}
                          </span>
                        </div>
                        {person.isConfirmed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" /> Confirmed
                          </span>
                        )}
                      </div>

                      {/* Phone Number with quick actions */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-stone-50 p-2.5">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-stone-400" />
                          <span className="font-mono text-xs font-semibold text-stone-800">
                            {person.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 transition shadow-2xs"
                            title={`Call ${person.name}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                            title={`Message ${person.name} on WhatsApp`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>

                      {person.notes && (
                        <p className="mt-2 text-xs italic text-stone-500">
                          "{person.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-1 border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAttendee(person)}
                        className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        title="Edit person"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttendee(person.id, person.name)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Remove person"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WHAT TO DO / IDEAS */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Curate ideas and activities for Cameron's bachelor weekend. Groomsmen can also vote on and suggest activities.
            </p>
            <Button tone="primary" onClick={handleOpenAddIdea}>
              <Plus className="h-4 w-4" /> Add Activity Idea
            </Button>
          </div>

          {bachelorParty.ideas.length === 0 ? (
            <EmptyState
              icon={<Compass className="h-6 w-6" />}
              title="No activities added yet"
              description="Add clay shooting, quad biking, golf, steakhouse dinners, or cabin getaways."
              action={
                <Button tone="primary" onClick={handleOpenAddIdea}>
                  <Plus className="h-4 w-4" /> Add First Idea
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bachelorParty.ideas.map(idea => {
                const categoryMeta = IDEA_CATEGORIES.find(c => c.id === idea.category) || IDEA_CATEGORIES[0];
                return (
                  <div
                    key={idea.id}
                    className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-[#1b382b]/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
                          <span>{categoryMeta.icon}</span> {categoryMeta.label}
                        </span>
                        {idea.status === 'top_pick' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Top Pick
                          </span>
                        ) : idea.status === 'booked' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3" /> Booked
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                            Idea
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">
                        {idea.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        {idea.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        {idea.estimatedCost && (
                          <span className="rounded-lg bg-emerald-50 border border-emerald-200/60 px-2 py-1 font-mono text-[11px] font-bold text-emerald-800">
                            💰 {idea.estimatedCost}
                          </span>
                        )}
                        {idea.location && (
                          <span className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] text-stone-600">
                            📍 {idea.location}
                          </span>
                        )}
                        <span className="rounded-lg bg-pink-50 border border-pink-200 px-2 py-1 text-[11px] font-semibold text-[#8a2947]">
                          👍 {idea.votes || 1} votes
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-1 border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEditIdea(idea)}
                        className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        title="Edit idea"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIdea(idea.id, idea.title)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Delete idea"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETAILS & NOTES */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="space-y-5 max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bachelor Hub Title">
              <input
                type="text"
                value={detailsForm.title}
                onChange={e => setDetailsForm(prev => ({ ...prev, title: e.target.value }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Tagline / Subtitle">
              <input
                type="text"
                value={detailsForm.tagline}
                onChange={e => setDetailsForm(prev => ({ ...prev, tagline: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target Date / Weekend" hint="e.g. Weekend of 12-14 March 2027">
              <input
                type="text"
                value={detailsForm.dateOrWeekend}
                onChange={e => setDetailsForm(prev => ({ ...prev, dateOrWeekend: e.target.value }))}
                className={inputClass}
                placeholder="e.g. March 2027 (Weekend TBC)"
              />
            </Field>
            <Field label="Destination / Area" hint="e.g. Wilderness / Knysna / George">
              <input
                type="text"
                value={detailsForm.destination}
                onChange={e => setDetailsForm(prev => ({ ...prev, destination: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Wilderness Forest Cabin"
              />
            </Field>
          </div>

          <Field label="Approximate Budget per Person">
            <input
              type="text"
              value={detailsForm.budgetPerPerson}
              onChange={e => setDetailsForm(prev => ({ ...prev, budgetPerPerson: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Approx. R1,500 - R2,500 pp"
            />
          </Field>

          <Field label="Cameron's Preferences & Rules (Groom Notes)" hint="What Cam loves, drinks preferences, things he ruled out, dietary notes">
            <textarea
              rows={3}
              value={detailsForm.groomNotes}
              onChange={e => setDetailsForm(prev => ({ ...prev, groomNotes: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Enjoys craft beer, steaks, outdoor activities. No embarrassing costumes in public."
            />
          </Field>

          <Field label="Organizer & Best Man Secret Notes" hint="Private coordination instructions for the Best Man & Groomsmen">
            <textarea
              rows={3}
              value={detailsForm.organizerNotes}
              onChange={e => setDetailsForm(prev => ({ ...prev, organizerNotes: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Coordinate with Henk for cabin booking. Split deposit by end of January."
            />
          </Field>

          <div className="flex justify-end pt-3">
            <Button type="submit" tone="primary" disabled={savingDetails}>
              {savingDetails ? 'Saving...' : 'Save Bachelor Details'}
            </Button>
          </div>
        </form>
      )}

      {/* MODAL: ADD / EDIT ATTENDEE */}
      <Modal
        open={attendeeModalOpen}
        onClose={() => setAttendeeModalOpen(false)}
        title={editingAttendee ? `Edit ${editingAttendee.name}` : 'Add Person to Bachelor Party'}
      >
        <form onSubmit={handleSaveAttendee} className="space-y-4">
          <Field label="Full Name">
            <input
              type="text"
              value={attendeeForm.name}
              onChange={e => setAttendeeForm(prev => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Henk"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone Number" hint="e.g. +27 82 123 4567">
              <input
                type="tel"
                value={attendeeForm.phone}
                onChange={e => setAttendeeForm(prev => ({ ...prev, phone: e.target.value }))}
                className={inputClass}
                placeholder="+27 82 123 4567"
                required
              />
            </Field>

            <Field label="Role / Relationship">
              <select
                value={attendeeForm.relationship}
                onChange={e => setAttendeeForm(prev => ({ ...prev, relationship: e.target.value }))}
                className={inputClass}
              >
                <option value="Best Man">👑 Best Man</option>
                <option value="Groomsman">🤵 Groomsman</option>
                <option value="Brother of Groom">Brother of Groom</option>
                <option value="Brother of Bride">Brother of Bride</option>
                <option value="Close Friend">Close Friend</option>
                <option value="Cousin">Cousin</option>
                <option value="High School Friend">High School Friend</option>
                <option value="University Friend">University Friend</option>
                <option value="Guest">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Notes / Arrival info">
            <input
              type="text"
              value={attendeeForm.notes}
              onChange={e => setAttendeeForm(prev => ({ ...prev, notes: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Bringing the braai wood, arriving Friday afternoon"
            />
          </Field>

          <Toggle
            checked={attendeeForm.isConfirmed ?? true}
            onChange={checked => setAttendeeForm(prev => ({ ...prev, isConfirmed: checked }))}
            label="Confirmed for Bachelor Party"
            description="Mark whether this person has confirmed they are attending the bachelor party."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button tone="secondary" onClick={() => setAttendeeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" tone="primary">
              {editingAttendee ? 'Save Changes' : 'Add Person'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: IMPORT FROM GUEST LIST */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Guests to Bachelor Party Roster"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500">
            Easily add guests from your wedding roster with their phone numbers into the bachelor party list.
          </p>

          {importableCandidates.length === 0 ? (
            <p className="py-6 text-center text-xs text-stone-400">
              All eligible guests from your roster are already added!
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {importableCandidates.map((c, idx) => (
                <div
                  key={`${c.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3 hover:bg-stone-100 transition"
                >
                  <div>
                    <p className="font-serif text-sm font-semibold text-stone-900">{c.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>{c.phone || 'No phone recorded'}</span>
                      <span>·</span>
                      <span className="font-medium text-[#1b382b]">{c.role}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    tone="primary"
                    onClick={() => handleImportCandidate(c)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button tone="secondary" onClick={() => setImportModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD / EDIT IDEA */}
      <Modal
        open={ideaModalOpen}
        onClose={() => setIdeaModalOpen(false)}
        title={editingIdea ? 'Edit Activity Idea' : 'Add Bachelor Activity Idea'}
      >
        <form onSubmit={handleSaveIdea} className="space-y-4">
          <Field label="Activity Title">
            <input
              type="text"
              value={ideaForm.title}
              onChange={e => setIdeaForm(prev => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Clay Pigeon Shooting & Spitbraai"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select
                value={ideaForm.category}
                onChange={e => setIdeaForm(prev => ({ ...prev, category: e.target.value as BachelorPartyIdeaCategory }))}
                className={inputClass}
              >
                {IDEA_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={ideaForm.status}
                onChange={e => setIdeaForm(prev => ({ ...prev, status: e.target.value as 'idea' | 'top_pick' | 'booked' }))}
                className={inputClass}
              >
                <option value="idea">💡 Idea / Under Discussion</option>
                <option value="top_pick">⭐ Top Pick / Shortlisted</option>
                <option value="booked">✅ Booked &amp; Final</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated Cost" hint="e.g. R550 pp">
              <input
                type="text"
                value={ideaForm.estimatedCost}
                onChange={e => setIdeaForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                className={inputClass}
                placeholder="e.g. R550 pp"
              />
            </Field>

            <Field label="Location / Venue" hint="e.g. Garden Route Shooting Range">
              <input
                type="text"
                value={ideaForm.location}
                onChange={e => setIdeaForm(prev => ({ ...prev, location: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Outeniqua Trail"
              />
            </Field>
          </div>

          <Field label="Description & Details">
            <textarea
              rows={3}
              value={ideaForm.description}
              onChange={e => setIdeaForm(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              placeholder="What this activity involves, timing, equipment needed..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button tone="secondary" onClick={() => setIdeaModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" tone="primary">
              {editingIdea ? 'Save Changes' : 'Add Idea'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
