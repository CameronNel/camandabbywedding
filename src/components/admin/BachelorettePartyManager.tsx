import React, { useMemo, useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  BachelorettePartyAttendee,
  BachelorettePartyConfig,
  BachelorettePartyIdea,
  BachelorettePartyIdeaCategory,
  HouseholdInvitation,
} from '../../types/wedding';
import { Button, EmptyState, Field, Modal, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

function generateAttendeeId(): string {
  return `bachelorette-attendee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateIdeaId(): string {
  return `bachelorette-idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface BachelorettePartyManagerProps {
  bacheloretteParty: BachelorettePartyConfig;
  households: HouseholdInvitation[];
  onUpdate: (data: Partial<BachelorettePartyConfig>) => Promise<void>;
  notify: (toast: ToastState) => void;
  onPreviewLive?: () => void;
}

const IDEA_CATEGORIES: Array<{ id: BachelorettePartyIdeaCategory; label: string; icon: string }> = [
  { id: 'wine_tasting', label: 'Wine Tasting & Vineyards', icon: '🍷' },
  { id: 'spa_wellness', label: 'Spa & Pamper Day', icon: '🧖‍♀️' },
  { id: 'weekend_trip', label: 'Weekend Getaway & Villa', icon: '🥂' },
  { id: 'high_tea', label: 'High Tea & Bubbly', icon: '🫖' },
  { id: 'nightlife', label: 'Cocktails & Night Out', icon: '🍸' },
  { id: 'adventure', label: 'Sunset Cruises & Outing', icon: '⛵' },
  { id: 'creative_workshop', label: 'Workshops & Crafting', icon: '🎨' },
  { id: 'food_drinks', label: 'Fine Dining & Tapas', icon: '🍰' },
  { id: 'other', label: 'Other Activities', icon: '💡' },
];

export const BachelorettePartyManager: React.FC<BachelorettePartyManagerProps> = ({
  bacheloretteParty,
  households,
  onUpdate,
  notify,
  onPreviewLive,
}) => {
  const [activeTab, setActiveTab] = useState<'women' | 'ideas' | 'details'>('women');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<BachelorettePartyAttendee | null>(null);
  const [attendeeForm, setAttendeeForm] = useState<Omit<BachelorettePartyAttendee, 'id'>>({
    name: '',
    phone: '',
    email: '',
    relationship: 'Bridesmaid',
    notes: '',
    isConfirmed: true,
  });

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BachelorettePartyIdea | null>(null);
  const [ideaForm, setIdeaForm] = useState<Omit<BachelorettePartyIdea, 'id'>>({
    title: '',
    description: '',
    category: 'wine_tasting',
    estimatedCost: '',
    location: '',
    status: 'idea',
    votes: 0,
  });

  // Trip details form state
  const [detailsForm, setDetailsForm] = useState({
    title: bacheloretteParty.title,
    tagline: bacheloretteParty.tagline,
    dateOrWeekend: bacheloretteParty.dateOrWeekend,
    destination: bacheloretteParty.destination,
    budgetPerPerson: bacheloretteParty.budgetPerPerson || '',
    organizerNotes: bacheloretteParty.organizerNotes,
    brideNotes: bacheloretteParty.brideNotes,
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Attendees search filter
  const filteredAttendees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bacheloretteParty.attendees;
    return bacheloretteParty.attendees.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.relationship && a.relationship.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q)),
    );
  }, [bacheloretteParty.attendees, searchQuery]);

  // Candidates for quick import from guest list
  const importableCandidates = useMemo(() => {
    const existingNames = new Set(bacheloretteParty.attendees.map(a => a.name.trim().toLowerCase()));
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
          role: h.tags.includes('maid_of_honor')
            ? 'Maid of Honor'
            : h.tags.includes('bridesmaid')
              ? 'Bridesmaid'
              : 'Wedding Guest',
          householdName: h.name,
        });
      }
      h.members.forEach(m => {
        if (!m.isPrimary && !existingNames.has(m.name.trim().toLowerCase())) {
          candidates.push({
            name: m.name,
            phone: m.phone || h.phone || '',
            email: m.email || h.email || '',
            role:
              m.role === 'maid_of_honor'
                ? 'Maid of Honor'
                : m.role === 'bridesmaid'
                  ? 'Bridesmaid'
                  : 'Guest Member',
            householdName: h.name,
          });
        }
      });
    });

    return candidates;
  }, [bacheloretteParty.attendees, households]);

  const handleCopyAllNumbers = () => {
    const numbers = bacheloretteParty.attendees
      .map(a => a.phone.trim())
      .filter(Boolean);

    if (!numbers.length) {
      notify({ tone: 'error', message: 'No phone numbers to copy.' });
      return;
    }

    void navigator.clipboard.writeText(numbers.join(', '));
    notify({ tone: 'success', message: `Copied ${numbers.length} phone numbers to clipboard!` });
  };

  // Save attendee
  const handleSaveAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeForm.name.trim()) {
      notify({ tone: 'error', message: 'Name is required' });
      return;
    }

    let updatedAttendees: BachelorettePartyAttendee[];
    if (editingAttendee) {
      updatedAttendees = bacheloretteParty.attendees.map(a =>
        a.id === editingAttendee.id
          ? {
              ...editingAttendee,
              ...attendeeForm,
              name: attendeeForm.name.trim(),
              phone: attendeeForm.phone.trim(),
              email: attendeeForm.email?.trim() || undefined,
              relationship: attendeeForm.relationship?.trim() || undefined,
              notes: attendeeForm.notes?.trim() || undefined,
            }
          : a,
      );
    } else {
      const newAttendee: BachelorettePartyAttendee = {
        id: generateAttendeeId(),
        name: attendeeForm.name.trim(),
        phone: attendeeForm.phone.trim(),
        email: attendeeForm.email?.trim() || undefined,
        relationship: attendeeForm.relationship?.trim() || undefined,
        notes: attendeeForm.notes?.trim() || undefined,
        isConfirmed: attendeeForm.isConfirmed,
      };
      updatedAttendees = [...bacheloretteParty.attendees, newAttendee];
    }

    try {
      await onUpdate({ attendees: updatedAttendees });
      notify({
        tone: 'success',
        message: editingAttendee ? 'Attendee updated.' : 'Attendee added.',
      });
      setAttendeeModalOpen(false);
      setEditingAttendee(null);
    } catch {
      notify({ tone: 'error', message: 'Failed to save attendee.' });
    }
  };

  const handleDeleteAttendee = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the bachelorette party guest list?`)) return;
    try {
      const updated = bacheloretteParty.attendees.filter(a => a.id !== id);
      await onUpdate({ attendees: updated });
      notify({ tone: 'success', message: `${name} removed.` });
    } catch {
      notify({ tone: 'error', message: 'Failed to remove attendee.' });
    }
  };

  // Import candidate
  const handleImportCandidate = async (candidate: {
    name: string;
    phone: string;
    email: string;
    role: string;
  }) => {
    const newAttendee: BachelorettePartyAttendee = {
      id: generateAttendeeId(),
      name: candidate.name,
      phone: candidate.phone,
      email: candidate.email || undefined,
      relationship: candidate.role,
      notes: `Imported from wedding guest list`,
      isConfirmed: true,
    };
    try {
      await onUpdate({ attendees: [...bacheloretteParty.attendees, newAttendee] });
      notify({ tone: 'success', message: `Added ${candidate.name} to the bachelorette party.` });
    } catch {
      notify({ tone: 'error', message: 'Failed to import attendee.' });
    }
  };

  const handleResetAllVotes = async () => {
    if (!window.confirm('Reset all bachelorette activity votes to 0?')) return;
    try {
      const updated = bacheloretteParty.ideas.map(i => ({ ...i, votes: 0, voterIds: [] }));
      await onUpdate({ ideas: updated });
      notify({ tone: 'success', message: 'All activity votes reset to 0.' });
    } catch {
      notify({ tone: 'error', message: 'Failed to reset votes.' });
    }
  };

  // Save idea
  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaForm.title.trim()) {
      notify({ tone: 'error', message: 'Title is required' });
      return;
    }

    let updatedIdeas: BachelorettePartyIdea[];
    if (editingIdea) {
      updatedIdeas = bacheloretteParty.ideas.map(i =>
        i.id === editingIdea.id
          ? {
              ...editingIdea,
              ...ideaForm,
              title: ideaForm.title.trim(),
              description: ideaForm.description.trim(),
              estimatedCost: ideaForm.estimatedCost?.trim() || undefined,
              location: ideaForm.location?.trim() || undefined,
              votes: ideaForm.votes ?? editingIdea.votes ?? 0,
            }
          : i,
      );
    } else {
      const newIdea: BachelorettePartyIdea = {
        id: generateIdeaId(),
        title: ideaForm.title.trim(),
        description: ideaForm.description.trim(),
        category: ideaForm.category,
        estimatedCost: ideaForm.estimatedCost?.trim() || undefined,
        location: ideaForm.location?.trim() || undefined,
        status: ideaForm.status,
        votes: ideaForm.votes ?? 0,
        voterIds: [],
      };
      updatedIdeas = [newIdea, ...bacheloretteParty.ideas];
    }

    try {
      await onUpdate({ ideas: updatedIdeas });
      notify({
        tone: 'success',
        message: editingIdea ? 'Idea updated.' : 'Idea added.',
      });
      setIdeaModalOpen(false);
      setEditingIdea(null);
    } catch {
      notify({ tone: 'error', message: 'Failed to save idea.' });
    }
  };

  const handleDeleteIdea = async (id: string, title: string) => {
    if (!confirm(`Delete idea "${title}"?`)) return;
    try {
      const updated = bacheloretteParty.ideas.filter(i => i.id !== id);
      await onUpdate({ ideas: updated });
      notify({ tone: 'success', message: `Idea deleted.` });
    } catch {
      notify({ tone: 'error', message: 'Failed to delete idea.' });
    }
  };

  const handleToggleTopPick = async (idea: BachelorettePartyIdea) => {
    const nextStatus = idea.status === 'top_pick' ? 'idea' : 'top_pick';
    try {
      const updated = bacheloretteParty.ideas.map(i =>
        i.id === idea.id ? { ...i, status: nextStatus as BachelorettePartyIdea['status'] } : i,
      );
      await onUpdate({ ideas: updated });
      notify({
        tone: 'success',
        message: nextStatus === 'top_pick' ? 'Marked as top pick ⭐' : 'Moved back to regular ideas.',
      });
    } catch {
      notify({ tone: 'error', message: 'Failed to update idea status.' });
    }
  };

  // Save Trip Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await onUpdate({
        title: detailsForm.title.trim(),
        tagline: detailsForm.tagline.trim(),
        dateOrWeekend: detailsForm.dateOrWeekend.trim(),
        destination: detailsForm.destination.trim(),
        budgetPerPerson: detailsForm.budgetPerPerson.trim() || undefined,
        organizerNotes: detailsForm.organizerNotes.trim(),
        brideNotes: detailsForm.brideNotes.trim(),
      });
      notify({ tone: 'success', message: 'Bachelorette party details updated successfully!' });
    } catch {
      notify({ tone: 'error', message: 'Failed to update details.' });
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#e4aeb5]/40 bg-gradient-to-r from-[#fdf2f4] via-[#fcf6f8] to-[#f7edf1] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9c2743]">
              <Sparkles className="h-4 w-4 text-[#9c2743]" />
              Organizer Portal &bull; Bachelorette Hub
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-stone-900">
              {bacheloretteParty.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              {bacheloretteParty.tagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onPreviewLive && (
              <Button
                tone="secondary"
                size="sm"
                onClick={onPreviewLive}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview Live Page
              </Button>
            )}
            <Button
              tone="secondary"
              size="sm"
              onClick={handleCopyAllNumbers}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy All Numbers ({bacheloretteParty.attendees.filter(a => a.phone).length})
            </Button>
          </div>
        </div>

        {/* Security / Privacy Warning */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e4aeb5]/50 bg-white/75 p-3.5 text-xs text-[#8a2947]">
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#9c2743]" />
          <span>
            <strong>Access Control:</strong> The public Bachelorette Party Hub is strictly accessible to guests tagged with <strong>Maid of Honor</strong> or <strong>Bridesmaid</strong> after unlocking with their code.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('women')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'women'
              ? 'border-[#9c2743] text-[#9c2743]'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="h-4 w-4" />
          The Wanted Ladies &amp; Numbers ({bacheloretteParty.attendees.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'ideas'
              ? 'border-[#9c2743] text-[#9c2743]'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Heart className="h-4 w-4" />
          Activities &amp; Ideas ({bacheloretteParty.ideas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'details'
              ? 'border-[#9c2743] text-[#9c2743]'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="h-4 w-4" />
          Trip Details &amp; Notes
        </button>
      </div>

      {/* TAB 1: ATTENDEES */}
      {activeTab === 'women' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search attendees or numbers…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                tone="secondary"
                size="sm"
                onClick={() => setImportModalOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Import from Guest List
              </Button>
              <Button
                tone="primary"
                size="sm"
                onClick={() => {
                  setEditingAttendee(null);
                  setAttendeeForm({
                    name: '',
                    phone: '',
                    email: '',
                    relationship: 'Bridesmaid',
                    notes: '',
                    isConfirmed: true,
                  });
                  setAttendeeModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Person
              </Button>
            </div>
          </div>

          {filteredAttendees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No attendees found"
              description="Add the people you want at the bachelorette party along with their contact numbers."
              action={
                <Button tone="primary" onClick={() => setAttendeeModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Person
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAttendees.map(attendee => {
                const cleanPhone = (attendee.phone || '').replace(/[^0-9+]/g, '');
                return (
                  <div
                    key={attendee.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#e4aeb5] hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-semibold text-stone-900">
                            {attendee.name}
                          </h3>
                          {attendee.relationship && (
                            <span className="inline-block mt-0.5 rounded-full bg-[#fdf2f4] border border-[#e4aeb5]/60 px-2 py-0.5 text-[11px] font-medium text-[#9c2743]">
                              {attendee.relationship}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAttendee(attendee);
                              setAttendeeForm({
                                name: attendee.name,
                                phone: attendee.phone,
                                email: attendee.email || '',
                                relationship: attendee.relationship || '',
                                notes: attendee.notes || '',
                                isConfirmed: attendee.isConfirmed !== false,
                              });
                              setAttendeeModalOpen(true);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 transition"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttendee(attendee.id, attendee.name)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-1.5 text-xs text-stone-600">
                        {attendee.phone ? (
                          <div className="flex items-center gap-2 font-mono text-stone-900 font-medium">
                            <Phone className="h-3.5 w-3.5 text-[#9c2743]" />
                            <span>{attendee.phone}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-stone-400 italic">
                            <Phone className="h-3.5 w-3.5" />
                            <span>No phone number listed</span>
                          </div>
                        )}
                        {attendee.notes && (
                          <p className="mt-2 text-[11px] text-stone-500 bg-stone-50 rounded-lg p-2 border border-stone-100">
                            {attendee.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick WhatsApp / Call actions */}
                    {cleanPhone && (
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                        <a
                          href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          WhatsApp
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                        >
                          <Phone className="h-3.5 w-3.5 text-stone-500" />
                          Call
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IDEAS */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              Brainstorm and vote on activities, venues, wine farms, spa days, and surprise events.
            </p>
            <div className="flex items-center gap-2">
              <Button
                tone="secondary"
                size="sm"
                onClick={handleResetAllVotes}
                title="Reset all votes on this page to 0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Votes to 0
              </Button>
              <Button
                tone="primary"
                size="sm"
                onClick={() => {
                  setEditingIdea(null);
                  setIdeaForm({
                    title: '',
                    description: '',
                    category: 'wine_tasting',
                    estimatedCost: '',
                    location: '',
                    status: 'idea',
                    votes: 0,
                  });
                  setIdeaModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Activity Idea
              </Button>
            </div>
          </div>

          {bacheloretteParty.ideas.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No ideas yet"
              description="Add ideas for activities, bookings, and destinations for the bachelorette party."
              action={
                <Button tone="primary" onClick={() => setIdeaModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Add First Idea
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bacheloretteParty.ideas.map(idea => {
                const categoryDef = IDEA_CATEGORIES.find(c => c.id === idea.category);
                const isTopPick = idea.status === 'top_pick';
                return (
                  <div
                    key={idea.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                      isTopPick
                        ? 'border-[#e4aeb5] bg-[#fdf2f4]/40 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700">
                          <span>{categoryDef?.icon || '✨'}</span>
                          <span>{categoryDef?.label || idea.category}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleTopPick(idea)}
                            className={`p-1 transition ${
                              isTopPick
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-stone-300 hover:text-amber-500'
                            }`}
                            title={isTopPick ? 'Remove top pick' : 'Mark as top pick'}
                          >
                            <Star className={`h-4 w-4 ${isTopPick ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIdea(idea);
                              setIdeaForm({
                                title: idea.title,
                                description: idea.description,
                                category: idea.category,
                                estimatedCost: idea.estimatedCost || '',
                                location: idea.location || '',
                                status: idea.status,
                                votes: idea.votes ?? 0,
                              });
                              setIdeaModalOpen(true);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 transition"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIdea(idea.id, idea.title)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="mt-2.5 font-display text-base font-semibold text-stone-900">
                        {idea.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                        {idea.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        {idea.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-stone-400" />
                            <span>{idea.location}</span>
                          </div>
                        )}
                        {idea.estimatedCost && (
                          <span className="font-semibold text-stone-700">
                            {idea.estimatedCost}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">
                        Votes: <strong className="text-stone-900">{idea.votes || 0}</strong>
                      </span>
                      {isTopPick && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#9c2743]">
                          <Check className="h-3 w-3" /> Top Pick
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETAILS */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="space-y-6 max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page Title">
              <input
                type="text"
                value={detailsForm.title}
                onChange={e => setDetailsForm({ ...detailsForm, title: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Weekend / Estimated Date">
              <input
                type="text"
                value={detailsForm.dateOrWeekend}
                onChange={e => setDetailsForm({ ...detailsForm, dateOrWeekend: e.target.value })}
                placeholder="e.g. April 2027 (Weekend TBC)"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Tagline / Header Description">
            <input
              type="text"
              value={detailsForm.tagline}
              onChange={e => setDetailsForm({ ...detailsForm, tagline: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination / General Area">
              <input
                type="text"
                value={detailsForm.destination}
                onChange={e => setDetailsForm({ ...detailsForm, destination: e.target.value })}
                placeholder="e.g. Franschhoek / Plettenberg Bay"
                className={inputClass}
              />
            </Field>
            <Field label="Budget Per Person Estimate">
              <input
                type="text"
                value={detailsForm.budgetPerPerson}
                onChange={e => setDetailsForm({ ...detailsForm, budgetPerPerson: e.target.value })}
                placeholder="e.g. Approx. R1,500 - R2,500 pp"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Bride's Personal Preferences &amp; Wishes"
            hint="Special notes on what Abby enjoys, dislikes, or would love to see."
          >
            <textarea
              rows={3}
              value={detailsForm.brideNotes}
              onChange={e => setDetailsForm({ ...detailsForm, brideNotes: e.target.value })}
              className={inputClass}
              placeholder="e.g. Loves boutique wine estates, relaxing spa treatments, sunset champagne, and delicious food..."
            />
          </Field>

          <Field
            label="Maid of Honor / Organizer Notes"
            hint="Private instructions for the bridal party on bookings, outfits, and surprises."
          >
            <textarea
              rows={3}
              value={detailsForm.organizerNotes}
              onChange={e => setDetailsForm({ ...detailsForm, organizerNotes: e.target.value })}
              className={inputClass}
              placeholder="e.g. Please send dietary requirements to the Maid of Honor. Don't mention the spa day to Abby!"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button tone="primary" type="submit" disabled={savingDetails}>
              {savingDetails ? 'Saving...' : 'Save Trip Details'}
            </Button>
          </div>
        </form>
      )}

      {/* MODAL: ADD / EDIT ATTENDEE */}
      <Modal
        open={attendeeModalOpen}
        onClose={() => setAttendeeModalOpen(false)}
        title={editingAttendee ? 'Edit Bachelorette Attendee' : 'Add Person to Bachelorette'}
      >
        <form onSubmit={handleSaveAttendee} className="space-y-4">
          <Field label="Full Name">
            <input
              type="text"
              value={attendeeForm.name}
              onChange={e => setAttendeeForm({ ...attendeeForm, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Phone Number" hint="Include country code (e.g. +27 82 123 4567) for WhatsApp button">
            <input
              type="tel"
              value={attendeeForm.phone}
              onChange={e => setAttendeeForm({ ...attendeeForm, phone: e.target.value })}
              placeholder="+27 82 000 0000"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role / Relationship">
              <input
                type="text"
                value={attendeeForm.relationship}
                onChange={e => setAttendeeForm({ ...attendeeForm, relationship: e.target.value })}
                placeholder="e.g. Maid of Honor / Bridesmaid / Sister"
                className={inputClass}
              />
            </Field>
            <Field label="Email Address (Optional)">
              <input
                type="email"
                value={attendeeForm.email}
                onChange={e => setAttendeeForm({ ...attendeeForm, email: e.target.value })}
                placeholder="sarah@example.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes / Roles">
            <input
              type="text"
              value={attendeeForm.notes}
              onChange={e => setAttendeeForm({ ...attendeeForm, notes: e.target.value })}
              placeholder="e.g. Organizing transport / Wine lover"
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button tone="secondary" type="button" onClick={() => setAttendeeModalOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" type="submit">
              {editingAttendee ? 'Update Person' : 'Add Person'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: IMPORT CANDIDATE FROM GUEST LIST */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Quick Import from Wedding Guest List"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-stone-500">
            Select guests or bridal party members to add directly to the bachelorette list:
          </p>
          {importableCandidates.length === 0 ? (
            <p className="py-6 text-center text-xs text-stone-400 italic">
              All eligible guests have already been added to the bachelorette list.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {importableCandidates.map((candidate, idx) => (
                <div
                  key={`${candidate.name}-${idx}`}
                  className="flex items-center justify-between py-2.5 gap-2"
                >
                  <div>
                    <span className="block text-xs font-semibold text-stone-900">
                      {candidate.name}
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      {candidate.role} &bull; {candidate.phone || 'No phone'}
                    </span>
                  </div>
                  <Button
                    tone="secondary"
                    size="sm"
                    type="button"
                    onClick={() => handleImportCandidate(candidate)}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2 border-t border-stone-100">
            <Button tone="secondary" type="button" onClick={() => setImportModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD / EDIT IDEA */}
      <Modal
        open={ideaModalOpen}
        onClose={() => setIdeaModalOpen(false)}
        title={editingIdea ? 'Edit Activity Idea' : 'Add Bachelorette Activity Idea'}
      >
        <form onSubmit={handleSaveIdea} className="space-y-4">
          <Field label="Activity Title">
            <input
              type="text"
              value={ideaForm.title}
              onChange={e => setIdeaForm({ ...ideaForm, title: e.target.value })}
              placeholder="e.g. Franschhoek Wine Tram &amp; Cellar Tour"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Category">
            <select
              value={ideaForm.category}
              onChange={e => setIdeaForm({ ...ideaForm, category: e.target.value as BachelorettePartyIdeaCategory })}
              className={inputClass}
            >
              {IDEA_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={ideaForm.description}
              onChange={e => setIdeaForm({ ...ideaForm, description: e.target.value })}
              placeholder="Describe what the activity entails, timing, why Abby will love it..."
              className={inputClass}
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Estimated Cost (Optional)">
              <input
                type="text"
                value={ideaForm.estimatedCost}
                onChange={e => setIdeaForm({ ...ideaForm, estimatedCost: e.target.value })}
                placeholder="e.g. R550 pp"
                className={inputClass}
              />
            </Field>
            <Field label="Location / Venue (Optional)">
              <input
                type="text"
                value={ideaForm.location}
                onChange={e => setIdeaForm({ ...ideaForm, location: e.target.value })}
                placeholder="e.g. Wine Valley / Day Spa"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button tone="secondary" type="button" onClick={() => setIdeaModalOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" type="submit">
              {editingIdea ? 'Update Idea' : 'Add Idea'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
