import { useMemo, useState } from 'react';
import {
  Beer,
  Calendar,
  Check,
  Copy,
  Flame,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import type { BachelorPartyIdea, BachelorPartyIdeaCategory } from '../types/wedding';
import { isBestManOrGroomsmanHousehold } from '../utils/guestTags';
import { getGuestVoterId, getVotedIdeaId, togglePageVote } from '../utils/voting';

interface BachelorPartyProps {
  onNavigate: (section: SectionId) => void;
}

const CATEGORY_FILTERS: Array<{ id: 'all' | BachelorPartyIdeaCategory; label: string; icon: string }> = [
  { id: 'all', label: 'All Activities', icon: '✨' },
  { id: 'outdoor', label: 'Outdoor & Shooting', icon: '🎯' },
  { id: 'adventure', label: 'Adventure', icon: '🏎️' },
  { id: 'weekend_trip', label: 'Weekend Getaways', icon: '🏕️' },
  { id: 'braai_chill', label: 'Braai & Chill', icon: '🥩' },
  { id: 'sports', label: 'Golf & Sports', icon: '⛳' },
  { id: 'food_drinks', label: 'Food & Drinks', icon: '🥃' },
];

export function BachelorParty({ onNavigate }: BachelorPartyProps) {
  const {
    activeHousehold,
    isGroomsmenEligible,
    adminOpen,
    isAdminLoggedIn,
    bachelorParty,
    updateBachelorParty,
    lookupInvitation,
  } = useGuestExperience();

  // Unlock form for unauthenticated visitors
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Search & Filters
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<'all' | BachelorPartyIdeaCategory>('all');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Suggest Idea Modal
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    title: '',
    description: '',
    category: 'outdoor' as BachelorPartyIdeaCategory,
    estimatedCost: '',
    location: '',
  });

  // Handle invite unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockCode.trim();
    if (!clean) {
      setUnlockError('Please enter your invitation code (e.g. Anr-658)');
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');
    try {
      const found = await lookupInvitation(clean);
      if (!found) {
        setUnlockError('No invitation found matching this code.');
      } else {
        const isGroomsman = isBestManOrGroomsmanHousehold(found);
        if (!isGroomsman) {
          setUnlockError(`Welcome ${found.name}! Your invite is valid, but this confidential page is strictly for the Best Man and Groomsmen.`);
        }
      }
    } catch {
      setUnlockError('Lookup failed. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Voter identity and 1-vote-per-page tracking
  const voterId = useMemo(() => getGuestVoterId(activeHousehold?.id), [activeHousehold?.id]);
  const votedIdeaId = useMemo(
    () => getVotedIdeaId('bachelor', bachelorParty.ideas, voterId),
    [bachelorParty.ideas, voterId],
  );
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  // Upvote or switch vote (1 vote per guest)
  const handleUpvote = async (ideaId: string) => {
    const result = togglePageVote('bachelor', bachelorParty.ideas, ideaId, voterId);
    await updateBachelorParty({ ideas: result.updatedIdeas });
    const targetIdea = bachelorParty.ideas.find(i => i.id === ideaId);
    const title = targetIdea?.title || 'Activity';
    if (result.action === 'voted') {
      setVoteFeedback(`Your 1 vote has been cast for "${title}"!`);
    } else if (result.action === 'switched') {
      setVoteFeedback(`Switched your 1 vote to "${title}"!`);
    } else {
      setVoteFeedback(`Removed your vote from "${title}".`);
    }
    window.setTimeout(() => setVoteFeedback(null), 4000);
  };

  // Submit suggestion
  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.title.trim()) return;

    // Withdraw any previous vote so the guest maintains exactly 1 vote
    const cleanedIdeas = bachelorParty.ideas.map(i => {
      if (i.id === votedIdeaId) {
        return {
          ...i,
          voterIds: (i.voterIds || []).filter(id => id !== voterId),
          votes: Math.max(0, (i.votes || 1) - 1),
        };
      }
      return i;
    });

    const newIdeaId = `idea-suggested-${Date.now()}`;
    const newIdea: BachelorPartyIdea = {
      id: newIdeaId,
      title: suggestForm.title.trim(),
      description: suggestForm.description.trim(),
      category: suggestForm.category,
      estimatedCost: suggestForm.estimatedCost.trim() || undefined,
      location: suggestForm.location.trim() || undefined,
      suggestedBy: activeHousehold?.name || 'Groomsman',
      status: 'idea',
      votes: 1,
      voterIds: [voterId],
    };

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`wedding_voted_bachelor_${voterId}`, newIdeaId);
      } catch {}
    }

    await updateBachelorParty({ ideas: [newIdea, ...cleanedIdeas] });
    setSuggestModalOpen(false);
    setVoteFeedback(`Suggested "${newIdea.title}" and cast your 1 vote for it!`);
    window.setTimeout(() => setVoteFeedback(null), 4000);
    setSuggestForm({
      title: '',
      description: '',
      category: 'outdoor',
      estimatedCost: '',
      location: '',
    });
  };

  // Copy all numbers
  const handleCopyNumbers = () => {
    const numbers = bachelorParty.attendees
      .map(a => a.phone.trim())
      .filter(Boolean);
    if (!numbers.length) return;

    void navigator.clipboard.writeText(numbers.join(', '));
    setCopiedMessage(true);
    window.setTimeout(() => setCopiedMessage(false), 3000);
  };

  // Filtered attendees
  const filteredAttendees = useMemo(() => {
    const q = attendeeSearch.trim().toLowerCase();
    if (!q) return bachelorParty.attendees;
    return bachelorParty.attendees.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.relationship && a.relationship.toLowerCase().includes(q)),
    );
  }, [bachelorParty.attendees, attendeeSearch]);

  // Filtered ideas
  const filteredIdeas = useMemo(() => {
    if (ideaCategory === 'all') return bachelorParty.ideas;
    return bachelorParty.ideas.filter(i => i.category === ideaCategory);
  }, [bachelorParty.ideas, ideaCategory]);

  // --- ACCESS GUARD ---
  // Strictly for Best Man and Groomsmen (or wedding organizers)
  const hasAccess = isGroomsmenEligible || adminOpen || isAdminLoggedIn;
  if (!hasAccess) {
    return (
      <section id="bachelor" className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-[#3e4437] via-[#2f3529] to-[#252b20] text-[#f5f6f2] pt-[110px] pb-20 flex items-center justify-center px-4">
        {/* Ambient misty forest glows: misty sage (#a2ac94) and dark olive (#404c24) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-[#404c24]/30 blur-[130px]" />
          <div className="absolute bottom-10 right-1/4 h-[380px] w-[380px] rounded-full bg-[#a2ac94]/20 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-lg w-full rounded-3xl border border-[#a2ac94]/40 bg-[#343a2e]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#a2ac94]/50 bg-gradient-to-br from-[#404c24] to-[#2e371b] text-[#d4c9c1] shadow-inner">
            <Lock className="h-8 w-8 text-[#d4c9c1]" />
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#a2ac94]/60 bg-[#404c24]/70 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cbccbc]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#a2ac94]" />
            Confidential · Groom&apos;s Party Only
          </span>

          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#f5f6f2]">
            Bachelor Party Hub
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-[#d4c9c1]">
            This private hub is strictly reserved for Cameron&apos;s <strong>Best Man</strong> and <strong>Groomsmen</strong> to coordinate the bachelor party, contact list, and activities.
          </p>

          {activeHousehold ? (
            <div className="mt-6 rounded-2xl border border-[#a2ac94]/30 bg-[#252a20]/90 p-4 text-left">
              <p className="text-xs text-[#d4c9c1]">
                You are currently viewed as <strong className="text-[#f5f6f2]">{activeHousehold.name}</strong>. This page is exclusive to the groom&apos;s party tags.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="flex-1 rounded-xl border border-[#a2ac94]/40 bg-[#3e4437]/80 px-4 py-2.5 text-xs font-semibold text-[#f5f6f2] hover:bg-[#4a5242] transition"
                >
                  Return to Home
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('rsvp')}
                  className="flex-1 rounded-xl border border-[#a2ac94]/60 bg-[#404c24] px-4 py-2.5 text-xs font-bold text-[#f5f6f2] shadow-md hover:bg-[#4d5c2c] transition"
                >
                  Go to RSVP
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="mt-6 space-y-3 text-left">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                Enter Groomsman Invite Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={unlockCode}
                  onChange={e => {
                    setUnlockCode(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="e.g. Anr-658"
                  className="flex-1 rounded-xl border border-[#a2ac94]/40 bg-[#242920]/90 px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-[#f5f6f2] placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-[#a2ac94]/70 focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                />
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="rounded-xl border border-[#a2ac94]/60 bg-gradient-to-r from-[#404c24] to-[#343e1d] px-5 py-2.5 text-xs font-bold text-[#f5f6f2] shadow-md hover:from-[#4d5c2c] hover:to-[#3e4b23] transition disabled:opacity-50"
                >
                  {isUnlocking ? 'Checking...' : 'Unlock'}
                </button>
              </div>

              {unlockError && (
                <p className="text-xs font-medium text-rose-300 leading-relaxed">
                  {unlockError}
                </p>
              )}

              <div className="pt-2 text-center text-[11px] text-[#cbccbc]">
                <span>Sample code: </span>
                <button
                  type="button"
                  onClick={() => {
                    setUnlockCode('Anr-658');
                    setUnlockError('');
                  }}
                  className="font-mono text-[#d4c9c1] underline hover:text-white"
                >
                  Anr-658 (Henk · Best Man)
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    );
  }

  // --- UNLOCKED / GROOMSMEN PAGE ---
  return (
    <section id="bachelor" className="anchor-section relative min-h-screen overflow-hidden bg-gradient-to-b from-[#3e4437] via-[#2f3529] to-[#252b20] pt-[95px] pb-24 text-[#f5f6f2]">
      {/* Ambient misty forest glows: misty sage (#a2ac94) & deep forest olive (#404c24) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[620px] w-[620px] rounded-full bg-[#404c24]/30 blur-[140px]" />
        <div className="absolute top-1/2 -right-20 h-[520px] w-[520px] rounded-full bg-[#a2ac94]/22 blur-[130px]" />
        <div className="absolute bottom-10 left-10 h-[480px] w-[480px] rounded-full bg-[#3e4437]/40 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a2ac94]/50 bg-[#404c24]/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#d4c9c1]">
              <Flame className="h-3.5 w-3.5 text-[#a2ac94]" />
              Groom&apos;s Crew · Confidential Hub
            </span>
            {activeHousehold && (
              <span className="rounded-full border border-[#cbccbc]/40 bg-[#3e4437]/80 px-3 py-1 text-[11px] font-semibold text-[#cbccbc]">
                Unlocked for: {activeHousehold.name}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#f5f6f2]">
            {bachelorParty.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#d4c9c1] max-w-2xl">
            {bachelorParty.tagline}
          </p>

          {/* Quick info ribbon */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#a2ac94]/30 bg-[#373e31]/85 p-3.5 backdrop-blur-sm shadow-md">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a2ac94]">
                <Calendar className="h-3.5 w-3.5 text-[#a2ac94]" /> Target Window
              </span>
              <p className="mt-1 font-serif text-sm font-semibold text-[#f5f6f2]">
                {bachelorParty.dateOrWeekend || 'Weekend TBC'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#a2ac94]/30 bg-[#373e31]/85 p-3.5 backdrop-blur-sm shadow-md">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#cbccbc]">
                <MapPin className="h-3.5 w-3.5 text-[#cbccbc]" /> Destination
              </span>
              <p className="mt-1 font-serif text-sm font-semibold text-[#f5f6f2]">
                {bachelorParty.destination || 'Garden Route'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#a2ac94]/30 bg-[#373e31]/85 p-3.5 backdrop-blur-sm shadow-md">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                💰 Est. Budget
              </span>
              <p className="mt-1 font-serif text-sm font-semibold text-[#f5f6f2]">
                {bachelorParty.budgetPerPerson || 'Budget TBC'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: THE MEN WANTED AT THE BACHELOR PARTY */}
        <div className="mt-14 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#a2ac94]/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#f5f6f2]">
                  The Roster — Men Wanted
                </h2>
                <span className="rounded-full bg-[#404c24] border border-[#a2ac94]/50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#f5f6f2]">
                  {bachelorParty.attendees.length}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#d4c9c1]">
                Everyone Cameron wants at his send-off, with direct phone numbers to start the group chat and coordinate.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a2ac94]" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={e => setAttendeeSearch(e.target.value)}
                  placeholder="Search names or numbers..."
                  className="w-48 sm:w-56 rounded-full border border-[#a2ac94]/40 bg-[#242920]/85 pl-8 pr-3 py-1.5 text-xs text-[#f5f6f2] placeholder:text-[#a2ac94]/70 focus:outline-none focus:ring-1 focus:ring-[#a2ac94]"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyNumbers}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#a2ac94]/60 bg-[#404c24]/85 px-4 py-1.5 text-xs font-bold text-[#f5f6f2] shadow-sm hover:bg-[#4d5c2c] transition"
              >
                {copiedMessage ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#cbccbc]" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy All Numbers
                  </>
                )}
              </button>
            </div>
          </div>

          {filteredAttendees.length === 0 ? (
            <div className="rounded-2xl border border-[#a2ac94]/30 bg-[#353c2f]/60 p-8 text-center text-[#d4c9c1]">
              No matching attendees found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAttendees.map(person => {
                const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
                return (
                  <div
                    key={person.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#a2ac94]/30 bg-[#353c2f]/90 p-4 sm:p-5 backdrop-blur-md shadow-xl hover:border-[#a2ac94] hover:bg-[#3b4334] transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#f5f6f2]">
                            {person.name}
                          </h3>
                          <span className="inline-block rounded-full bg-[#404c24]/80 border border-[#a2ac94]/50 px-2 py-0.5 text-[10px] font-bold text-[#cbccbc]">
                            {person.relationship || 'Guest'}
                          </span>
                        </div>
                        {person.isConfirmed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#2a381b] border border-[#a2ac94]/70 px-2 py-0.5 text-[10px] font-bold text-[#d4c9c1]">
                            <Check className="h-3 w-3 text-[#a2ac94]" /> Confirmed
                          </span>
                        )}
                      </div>

                      {/* Phone Call & WhatsApp Bar */}
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#a2ac94]/25 bg-[#252a20]/90 p-2.5">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-[#a2ac94]" />
                          <span className="font-mono text-xs font-bold text-[#f5f6f2]">
                            {person.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#a2ac94]/40 bg-[#3e4437] text-[#f5f6f2] hover:bg-[#4c5443] transition shadow-sm"
                            title={`Call ${person.name}`}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#a2ac94]/50 bg-[#404c24] text-white hover:bg-[#4d5c2c] transition shadow-sm"
                            title={`Message ${person.name} on WhatsApp`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </div>
                      </div>

                      {person.notes && (
                        <p className="mt-2.5 text-xs text-[#d4c9c1] italic">
                          &quot;{person.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: WHAT TO DO — ACTIVITIES & IDEAS */}
        <div className="mt-16 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#a2ac94]/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#f5f6f2]">
                  What To Do — Activities &amp; Ideas
                </h2>
                <span className="rounded-full bg-[#404c24] border border-[#a2ac94]/50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#cbccbc]">
                  {bachelorParty.ideas.length}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#d4c9c1]">
                Curated activities for Cameron&apos;s weekend. Each guest gets 1 vote — tap to choose your favourite!
              </p>
              {voteFeedback && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#404c24] border border-[#a2ac94]/40 px-3 py-1 text-xs font-semibold text-[#f5f6f2] animate-in fade-in">
                  <span>🎯 {voteFeedback}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuggestModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#a2ac94]/60 bg-gradient-to-r from-[#404c24] to-[#343e1d] px-5 py-2 text-xs font-bold text-[#f5f6f2] shadow-md hover:from-[#4d5c2c] hover:to-[#3e4b23] transition"
            >
              <Plus className="h-4 w-4" />
              Suggest an Activity
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map(cat => {
              const active = ideaCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setIdeaCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border border-[#cbccbc] bg-[#404c24] text-[#f5f6f2] font-bold shadow-sm'
                      : 'border border-[#a2ac94]/35 bg-[#32382c]/80 text-[#d4c9c1] hover:bg-[#3d4436] hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ideas Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map(idea => (
              <div
                key={idea.id}
                className="flex flex-col justify-between rounded-2xl border border-[#a2ac94]/30 bg-[#353c2f]/90 p-5 backdrop-blur-md shadow-xl hover:border-[#a2ac94] hover:bg-[#3b4334] transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#252a20] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#cbccbc]">
                      {idea.category.replace('_', ' ')}
                    </span>
                    {idea.status === 'top_pick' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#cbccbc]/50 bg-[#404c24]/90 px-2.5 py-0.5 text-[10px] font-bold text-[#d4c9c1]">
                        <Star className="h-3 w-3 fill-[#d4c9c1] text-[#d4c9c1]" /> Top Pick
                      </span>
                    ) : idea.status === 'booked' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#a2ac94]/70 bg-[#2d391e]/90 px-2.5 py-0.5 text-[10px] font-bold text-[#d4c9c1]">
                        <Check className="h-3 w-3 text-[#a2ac94]" /> Booked
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-serif text-xl font-bold text-[#f5f6f2]">
                    {idea.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#d4c9c1]">
                    {idea.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    {idea.estimatedCost && (
                      <span className="rounded-lg bg-[#252a20] border border-[#a2ac94]/50 px-2.5 py-1 font-mono text-[11px] font-bold text-[#cbccbc]">
                        💰 {idea.estimatedCost}
                      </span>
                    )}
                    {idea.location && (
                      <span className="rounded-lg bg-[#252a20] px-2.5 py-1 text-[11px] text-[#d4c9c1]">
                        📍 {idea.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#a2ac94]/25 pt-3">
                  <span className="text-[11px] text-[#cbccbc]">
                    {idea.suggestedBy ? `By ${idea.suggestedBy}` : 'Core Plan'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpvote(idea.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold transition transform active:scale-95 shadow-sm ${
                      idea.id === votedIdeaId
                        ? 'border-[#8ea268] bg-[#62773b] text-white ring-2 ring-[#8ea268]/40 shadow-md'
                        : votedIdeaId
                        ? 'border-[#a2ac94]/30 bg-[#2b3224]/70 text-[#cbccbc] hover:border-[#a2ac94]/60 hover:bg-[#38422e] hover:text-white'
                        : 'border-[#a2ac94]/50 bg-[#404c24]/80 text-[#d4c9c1] hover:bg-[#4d5c2c] hover:text-white'
                    }`}
                    title={
                      idea.id === votedIdeaId
                        ? 'You voted for this activity. Click to remove vote.'
                        : votedIdeaId
                        ? 'You have 1 vote per page. Click to switch your vote here.'
                        : 'Vote for this activity (1 vote per guest)'
                    }
                    aria-pressed={idea.id === votedIdeaId}
                  >
                    {idea.id === votedIdeaId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>{idea.votes || 0}</span>
                        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Your Vote</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="h-3.5 w-3.5 text-[#cbccbc]" />
                        <span>{idea.votes || 0}</span>
                        {votedIdeaId && <span className="ml-1 text-[10px] opacity-75">Switch</span>}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: GROOM'S NOTES & SECRET INSTRUCTIONS */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {bachelorParty.groomNotes && (
            <div className="rounded-3xl border border-[#a2ac94]/40 bg-gradient-to-br from-[#384032]/95 to-[#2c3226]/95 p-6 backdrop-blur-sm shadow-xl">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4c9c1]">
                <Beer className="h-4 w-4 text-[#a2ac94]" /> Cameron&apos;s Preferences &amp; Wishlist
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#f5f6f2]">
                {bachelorParty.groomNotes}
              </p>
            </div>
          )}

          {bachelorParty.organizerNotes && (
            <div className="rounded-3xl border border-[#404c24]/60 bg-gradient-to-br from-[#303829]/95 to-[#242a1f]/95 p-6 backdrop-blur-sm shadow-xl">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cbccbc]">
                <ShieldAlert className="h-4 w-4 text-[#a2ac94]" /> Secret Coordination Notes
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#f5f6f2]">
                {bachelorParty.organizerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Navigation actions back to site */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 border-t border-[#a2ac94]/30 pt-8">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#a2ac94]/40 bg-[#3e4437]/80 px-6 text-xs font-semibold text-[#f5f6f2] hover:bg-[#4a5242] transition"
          >
            ← Return to Wedding Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('rsvp')}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#a2ac94]/60 bg-[#404c24] px-6 text-xs font-bold text-[#f5f6f2] shadow-md hover:bg-[#4d5c2c] transition transform hover:scale-[1.02]"
          >
            Go to Wedding RSVP →
          </button>
        </div>
      </div>

      {/* SUGGEST IDEA MODAL */}
      {suggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#a2ac94]/50 bg-[#33392d] p-6 text-[#f5f6f2] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#a2ac94]/30 pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#f5f6f2]">
                Suggest an Activity Idea
              </h3>
              <button
                type="button"
                onClick={() => setSuggestModalOpen(false)}
                className="rounded-full p-1 text-[#cbccbc] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                  Activity Title
                </label>
                <input
                  type="text"
                  value={suggestForm.title}
                  onChange={e => setSuggestForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Go-Kart Grand Prix & Beers"
                  className="mt-1 w-full rounded-xl border border-[#a2ac94]/40 bg-[#242920] px-3.5 py-2 text-sm text-[#f5f6f2] focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                    Category
                  </label>
                  <select
                    value={suggestForm.category}
                    onChange={e => setSuggestForm(prev => ({ ...prev, category: e.target.value as BachelorPartyIdeaCategory }))}
                    className="mt-1 w-full rounded-xl border border-[#a2ac94]/40 bg-[#242920] px-3.5 py-2 text-sm text-[#f5f6f2] focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                  >
                    <option value="outdoor">🎯 Outdoor &amp; Shooting</option>
                    <option value="adventure">🏎️ Adventure &amp; Quad</option>
                    <option value="weekend_trip">🏕️ Weekend Cabin</option>
                    <option value="braai_chill">🥩 Braai &amp; Chill</option>
                    <option value="sports">⛳ Golf &amp; Sports</option>
                    <option value="food_drinks">🥃 Food &amp; Tasting</option>
                    <option value="nightlife">🍻 Nightlife</option>
                    <option value="other">💡 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                    Estimated Cost (pp)
                  </label>
                  <input
                    type="text"
                    value={suggestForm.estimatedCost}
                    onChange={e => setSuggestForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    placeholder="e.g. R450 pp"
                    className="mt-1 w-full rounded-xl border border-[#a2ac94]/40 bg-[#242920] px-3.5 py-2 text-sm text-[#f5f6f2] focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={suggestForm.location}
                  onChange={e => setSuggestForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. George / Wilderness"
                  className="mt-1 w-full rounded-xl border border-[#a2ac94]/40 bg-[#242920] px-3.5 py-2 text-sm text-[#f5f6f2] focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d4c9c1]">
                  Description &amp; Why Cam would love it
                </label>
                <textarea
                  rows={3}
                  value={suggestForm.description}
                  onChange={e => setSuggestForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details, timing, gear needed..."
                  className="mt-1 w-full rounded-xl border border-[#a2ac94]/40 bg-[#242920] px-3.5 py-2 text-sm text-[#f5f6f2] focus:outline-none focus:ring-2 focus:ring-[#a2ac94]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#a2ac94]/30">
                <button
                  type="button"
                  onClick={() => setSuggestModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#cbccbc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-[#a2ac94]/60 bg-gradient-to-r from-[#404c24] to-[#343e1d] px-5 py-2 text-xs font-bold text-[#f5f6f2] hover:from-[#4d5c2c] hover:to-[#3e4b23] transition shadow-md"
                >
                  Submit Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
