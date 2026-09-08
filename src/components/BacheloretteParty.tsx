import { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Compass,
  Copy,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  Wine,
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import type { BachelorettePartyIdea, BachelorettePartyIdeaCategory } from '../types/wedding';
import { isMaidOfHonorOrBridesmaidHousehold } from '../utils/guestTags';
import { getGuestVoterId, getVotedIdeaId, togglePageVote } from '../utils/voting';

interface BachelorettePartyProps {
  onNavigate: (section: SectionId) => void;
}

const CATEGORY_FILTERS: Array<{ id: 'all' | BachelorettePartyIdeaCategory; label: string; icon: string }> = [
  { id: 'all', label: 'All Activities', icon: '✨' },
  { id: 'wine_tasting', label: 'Wine Tasting', icon: '🍷' },
  { id: 'spa_wellness', label: 'Spa & Pamper', icon: '🧖‍♀️' },
  { id: 'weekend_trip', label: 'Weekend Getaways', icon: '🥂' },
  { id: 'high_tea', label: 'High Tea', icon: '🫖' },
  { id: 'nightlife', label: 'Cocktails & Night Out', icon: '🍸' },
  { id: 'adventure', label: 'Cruises & Outing', icon: '⛵' },
  { id: 'creative_workshop', label: 'Workshops', icon: '🎨' },
  { id: 'food_drinks', label: 'Dining & Tapas', icon: '🍰' },
];

export function BacheloretteParty({ onNavigate }: BachelorettePartyProps) {
  const {
    activeHousehold,
    isBridalPartyEligible,
    adminOpen,
    isAdminLoggedIn,
    bacheloretteParty,
    updateBacheloretteParty,
    lookupInvitation,
  } = useGuestExperience();

  // Unlock form for unauthenticated visitors
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Search & Filters
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<'all' | BachelorettePartyIdeaCategory>('all');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Suggest Idea Modal
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    title: '',
    description: '',
    category: 'wine_tasting' as BachelorettePartyIdeaCategory,
    estimatedCost: '',
    location: '',
  });

  // Handle invite unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockCode.trim();
    if (!clean) {
      setUnlockError('Please enter your invitation code.');
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');
    try {
      const found = await lookupInvitation(clean);
      if (!found) {
        setUnlockError('No invitation found matching this code.');
      } else {
        const isEligible = isMaidOfHonorOrBridesmaidHousehold(found);
        if (!isEligible) {
          setUnlockError(`Welcome ${found.name}! Your invite is valid, but this confidential page is strictly for the Maid of Honor and Bridesmaids.`);
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
    () => getVotedIdeaId('bachelorette', bacheloretteParty.ideas, voterId),
    [bacheloretteParty.ideas, voterId],
  );
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  // Upvote or switch vote (1 vote per guest)
  const handleUpvote = async (ideaId: string) => {
    const result = togglePageVote('bachelorette', bacheloretteParty.ideas, ideaId, voterId);
    await updateBacheloretteParty({ ideas: result.updatedIdeas });
    const targetIdea = bacheloretteParty.ideas.find(i => i.id === ideaId);
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
    const cleanedIdeas = bacheloretteParty.ideas.map(i => {
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
    const newIdea: BachelorettePartyIdea = {
      id: newIdeaId,
      title: suggestForm.title.trim(),
      description: suggestForm.description.trim(),
      category: suggestForm.category,
      estimatedCost: suggestForm.estimatedCost.trim() || undefined,
      location: suggestForm.location.trim() || undefined,
      suggestedBy: activeHousehold?.name || 'Bridesmaid',
      status: 'idea',
      votes: 1,
      voterIds: [voterId],
    };

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`wedding_voted_bachelorette_${voterId}`, newIdeaId);
      } catch {}
    }

    await updateBacheloretteParty({ ideas: [newIdea, ...cleanedIdeas] });
    setSuggestModalOpen(false);
    setVoteFeedback(`Suggested "${newIdea.title}" and cast your 1 vote for it!`);
    window.setTimeout(() => setVoteFeedback(null), 4000);
    setSuggestForm({
      title: '',
      description: '',
      category: 'wine_tasting',
      estimatedCost: '',
      location: '',
    });
  };

  // Copy all numbers
  const handleCopyNumbers = () => {
    const numbers = bacheloretteParty.attendees
      .map(a => a.phone.trim())
      .filter(Boolean);
    if (!numbers.length) return;

    void navigator.clipboard.writeText(numbers.join(', '));
    setCopiedMessage(true);
    window.setTimeout(() => setCopiedMessage(false), 3000);
  };

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    const q = attendeeSearch.trim().toLowerCase();
    if (!q) return bacheloretteParty.attendees;
    return bacheloretteParty.attendees.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.relationship && a.relationship.toLowerCase().includes(q)),
    );
  }, [bacheloretteParty.attendees, attendeeSearch]);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    if (ideaCategory === 'all') return bacheloretteParty.ideas;
    return bacheloretteParty.ideas.filter(i => i.category === ideaCategory);
  }, [bacheloretteParty.ideas, ideaCategory]);

  // Is page unlocked?
  const isUnlocked = isBridalPartyEligible || adminOpen || isAdminLoggedIn;

  // GATED VIEW IF NOT UNLOCKED
  if (!isUnlocked) {
    return (
      <section id="bachelorette" className="relative min-h-[90vh] bg-gradient-to-b from-[#faf4f6] via-[#f7ebf0] to-[#f4e2e8] pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="relative z-10 mx-auto max-w-lg w-full text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#f8b4c4] to-[#c94d6e] text-white shadow-xl shadow-[#9c2743]/20">
            <Lock className="h-8 w-8 text-white" />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#e4aeb5]/80 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9c2743] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#9c2743]" />
            Private Access &bull; Bridal Party Only
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Abby&apos;s Bachelorette Hub
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            This confidential planning hub contains attendee contact numbers and surprise event ideas strictly for the <strong>Maid of Honor</strong> and <strong>Bridesmaids</strong>.
          </p>

          <div className="mt-8 rounded-3xl border border-[#e4aeb5]/70 bg-white/95 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Enter Your Personal Invite Code
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Check your wedding invitation card for your personal code
            </p>

            <form onSubmit={handleUnlock} className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={unlockCode}
                onChange={e => { setUnlockCode(e.target.value); setUnlockError(''); }}
                placeholder="Your invitation code"
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-stone-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:border-[#9c2743] focus:outline-none focus:ring-2 focus:ring-[#9c2743]"
                spellCheck={false}
                autoComplete="one-time-code"
              />
              <button
                type="submit"
                disabled={isUnlocking}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9c2743] to-[#c94d6e] px-6 text-xs font-bold text-white shadow-md hover:from-[#872039] hover:to-[#b0405e] disabled:opacity-60 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isUnlocking ? 'Unlocking…' : 'Unlock Hub'}
              </button>
            </form>

            {unlockError && (
              <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 font-medium">
                {unlockError}
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-stone-900 underline underline-offset-2 transition"
              >
                &larr; Back to home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rsvp')}
                className="hover:text-stone-900 underline underline-offset-2 transition"
              >
                Go to RSVP
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // UNLOCKED VIEW
  return (
    <section id="bachelorette" className="min-h-screen bg-gradient-to-b from-[#faf4f6] via-[#fcf6f8] to-[#f9edf2] text-stone-900 pt-24 pb-24">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden border-b border-[#e4aeb5]/40 bg-gradient-to-br from-[#f8e3ea] via-[#faebf1] to-[#fef6f9] py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4aeb5] bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#9c2743] shadow-sm">
              <Wine className="h-3.5 w-3.5 text-[#9c2743]" />
              Confidential &bull; Maid of Honor &amp; Bridesmaids
            </div>

            {activeHousehold && (
              <span className="text-xs text-stone-600 bg-white/80 border border-[#e4aeb5]/60 px-3 py-1 rounded-full font-medium shadow-xs">
                Logged in as: <strong className="text-[#9c2743]">{activeHousehold.name}</strong>
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-stone-900">
            {bacheloretteParty.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-stone-700 leading-relaxed">
            {bacheloretteParty.tagline}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl">
            <div className="rounded-2xl border border-[#e4aeb5]/50 bg-white/90 p-4 backdrop-blur-xs shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Proposed Timing</span>
              <div className="mt-1 flex items-center gap-1.5 font-display text-lg font-medium text-stone-900">
                <Calendar className="h-4 w-4 text-[#9c2743]" />
                {bacheloretteParty.dateOrWeekend || 'Weekend TBC'}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4aeb5]/50 bg-white/90 p-4 backdrop-blur-xs shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Destination</span>
              <div className="mt-1 flex items-center gap-1.5 font-display text-lg font-medium text-stone-900">
                <MapPin className="h-4 w-4 text-[#9c2743]" />
                {bacheloretteParty.destination || 'Garden Route'}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4aeb5]/50 bg-white/90 p-4 backdrop-blur-xs shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Est. Budget</span>
              <div className="mt-1 flex items-center gap-1.5 font-display text-lg font-medium text-stone-900">
                <Sparkles className="h-4 w-4 text-[#9c2743]" />
                {bacheloretteParty.budgetPerPerson || 'Budget TBC'}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4aeb5]/50 bg-white/90 p-4 backdrop-blur-xs shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Guest List</span>
              <div className="mt-1 flex items-center gap-1.5 font-display text-lg font-medium text-stone-900">
                <Heart className="h-4 w-4 text-[#9c2743]" />
                {bacheloretteParty.attendees.length} Wanted Ladies
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* SECTION 1: WANTED ATTENDEES & NUMBERS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e4aeb5]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9c2743]">
                <Heart className="h-4 w-4 text-[#9c2743]" />
                The Wanted Ladies &amp; Contacts
              </div>
              <h2 className="mt-0.5 font-display text-2xl font-semibold text-stone-900">
                Attendee Directory ({bacheloretteParty.attendees.length})
              </h2>
              <p className="text-xs text-stone-600">
                All phone numbers wanted for the bachelorette party so the Maid of Honor can easily coordinate.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyNumbers}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e4aeb5] bg-white px-4 py-2 text-xs font-bold text-[#9c2743] hover:bg-[#fdf2f4] transition shadow-xs"
              >
                {copiedMessage ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#9c2743]" />}
                {copiedMessage ? 'Copied all numbers!' : 'Copy all phone numbers'}
              </button>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, role, or phone…"
              value={attendeeSearch}
              onChange={e => setAttendeeSearch(e.target.value)}
              className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743] shadow-xs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAttendees.map(attendee => {
              const cleanPhone = (attendee.phone || '').replace(/[^0-9+]/g, '');
              const isBride = (attendee.relationship || '').toLowerCase().includes('bride') && !(attendee.relationship || '').toLowerCase().includes('maid');
              const isMOH = (attendee.relationship || '').toLowerCase().includes('maid of honor') || (attendee.relationship || '').toLowerCase().includes('matron');

              return (
                <div
                  key={attendee.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition ${
                    isBride
                      ? 'border-[#e4aeb5] bg-gradient-to-br from-[#fdf2f4] via-[#fcf6f8] to-[#faebf0] shadow-sm ring-1 ring-[#e4aeb5]'
                      : isMOH
                        ? 'border-[#e4aeb5]/70 bg-[#fffafd] shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-stone-900 leading-snug">
                          {attendee.name}
                        </h3>
                        {attendee.relationship && (
                          <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            isBride
                              ? 'bg-[#9c2743] text-white border-[#872039]'
                              : isMOH
                                ? 'bg-[#fdf2f4] text-[#9c2743] border-[#e4aeb5]'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}>
                            {attendee.relationship}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-stone-600">
                      {attendee.phone ? (
                        <div className="flex items-center gap-2 font-mono text-stone-900 font-semibold">
                          <Phone className="h-3.5 w-3.5 text-[#9c2743]" />
                          <span>{attendee.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-stone-400 italic">
                          <Phone className="h-3.5 w-3.5" />
                          <span>No phone provided</span>
                        </div>
                      )}

                      {attendee.notes && (
                        <p className="mt-2 text-xs text-stone-600 bg-white/80 rounded-xl p-3 border border-[#e4aeb5]/30 leading-relaxed shadow-2xs">
                          {attendee.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {cleanPhone && (
                    <div className="mt-5 pt-3.5 border-t border-[#e4aeb5]/30 flex items-center gap-2.5">
                      <a
                        href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-2xs"
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
        </section>

        {/* SECTION 2: IDEAS & ACTIVITIES (WHAT TO DO) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e4aeb5]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9c2743]">
                <Sparkles className="h-4 w-4 text-[#9c2743]" />
                What To Do &bull; Activities &amp; Outings
              </div>
              <h2 className="mt-0.5 font-display text-2xl font-semibold text-stone-900">
                Ideas &amp; Voting ({bacheloretteParty.ideas.length})
              </h2>
              <p className="text-xs text-stone-600">
                Vote for your favourite activity (each guest gets 1 vote) or suggest something special for Abby!
              </p>
              {voteFeedback && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#9c2743]/10 border border-[#9c2743]/20 px-3 py-1 text-xs font-semibold text-[#9c2743] animate-in fade-in">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{voteFeedback}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuggestModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#9c2743] to-[#c94d6e] px-5 py-2 text-xs font-bold text-white shadow-md hover:from-[#872039] hover:to-[#b0405e] transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              Suggest an Idea
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_FILTERS.map(cat => {
              const active = ideaCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setIdeaCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#9c2743] text-white shadow-xs'
                      : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map(idea => {
              const isTopPick = idea.status === 'top_pick';
              const categoryDef = CATEGORY_FILTERS.find(c => c.id === idea.category);

              return (
                <div
                  key={idea.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                    isTopPick
                      ? 'border-[#e4aeb5] bg-gradient-to-br from-[#fdf2f4] via-[#fcf6f8] to-white shadow-sm ring-1 ring-[#e4aeb5]/60'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700">
                        <span>{categoryDef?.icon || '✨'}</span>
                        <span>{categoryDef?.label || idea.category}</span>
                      </span>

                      {isTopPick && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf2f4] border border-[#e4aeb5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9c2743]">
                          <Star className="h-3 w-3 fill-[#9c2743] text-[#9c2743]" /> Top Pick
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-base font-semibold text-stone-900">
                      {idea.title}
                    </h3>
                    <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      {idea.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-stone-400" />
                          <span>{idea.location}</span>
                        </div>
                      )}
                      {idea.estimatedCost && (
                        <span className="font-semibold text-stone-800">
                          {idea.estimatedCost}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">
                        Votes: <strong className="text-stone-900">{idea.votes || 0}</strong>
                      </span>
                      {idea.id === votedIdeaId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#9c2743]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9c2743]">
                          <Check className="h-3 w-3" /> Your Vote
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(idea.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 shadow-2xs ${
                        idea.id === votedIdeaId
                          ? 'border-[#9c2743] bg-[#9c2743] text-white hover:bg-[#872039]'
                          : votedIdeaId
                          ? 'border-stone-200 bg-white text-stone-700 hover:border-[#e4aeb5] hover:bg-[#fdf2f4] hover:text-[#9c2743]'
                          : 'border-[#e4aeb5] bg-[#fdf2f4] text-[#9c2743] hover:bg-[#fadce2]'
                      }`}
                      title={
                        idea.id === votedIdeaId
                          ? 'You voted for this activity. Click to remove your vote.'
                          : votedIdeaId
                          ? 'You have 1 vote per page. Click to switch your vote here.'
                          : 'Vote for this activity (1 vote per guest)'
                      }
                      aria-pressed={idea.id === votedIdeaId}
                    >
                      {idea.id === votedIdeaId ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Voted
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {votedIdeaId ? 'Switch' : 'Vote'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: NOTES & INTEL */}
        <section className="grid gap-4 sm:grid-cols-2">
          {bacheloretteParty.brideNotes && (
            <div className="rounded-3xl border border-[#e4aeb5]/60 bg-gradient-to-br from-[#fdf2f4] via-[#fcf6f8] to-white p-6 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9c2743]">
                <Heart className="h-3.5 w-3.5 text-[#9c2743]" />
                Abby&apos;s Preferences &amp; Wishes
              </span>
              <p className="mt-2 text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                &ldquo;{bacheloretteParty.brideNotes}&rdquo;
              </p>
            </div>
          )}

          {bacheloretteParty.organizerNotes && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                <Compass className="h-3.5 w-3.5 text-[#9c2743]" />
                Maid of Honor Instructions
              </span>
              <p className="mt-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                {bacheloretteParty.organizerNotes}
              </p>
            </div>
          )}
        </section>

        {/* Back to Wedding Navigation */}
        <div className="pt-6 border-t border-[#e4aeb5]/40 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-stone-900 font-semibold underline underline-offset-4 transition"
          >
            &larr; Back to Main Wedding Website
          </button>
          <button
            type="button"
            onClick={() => onNavigate('rsvp')}
            className="hover:text-stone-900 font-semibold underline underline-offset-4 transition"
          >
            Review RSVP Details &rarr;
          </button>
        </div>
      </div>

      {/* SUGGEST IDEA MODAL */}
      {suggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                Suggest an Activity for Abby
              </h3>
              <button
                type="button"
                onClick={() => setSuggestModalOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Activity Title</label>
                <input
                  type="text"
                  required
                  value={suggestForm.title}
                  onChange={e => setSuggestForm({ ...suggestForm, title: e.target.value })}
                  placeholder="e.g. Sunset Champagne Catamaran Cruise"
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Category</label>
                <select
                  value={suggestForm.category}
                  onChange={e => setSuggestForm({ ...suggestForm, category: e.target.value as BachelorettePartyIdeaCategory })}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
                >
                  {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={suggestForm.description}
                  onChange={e => setSuggestForm({ ...suggestForm, description: e.target.value })}
                  placeholder="Details of what we'd do, timing, what makes it fun..."
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Estimated Cost (Optional)</label>
                  <input
                    type="text"
                    value={suggestForm.estimatedCost}
                    onChange={e => setSuggestForm({ ...suggestForm, estimatedCost: e.target.value })}
                    placeholder="e.g. R450 pp"
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Location (Optional)</label>
                  <input
                    type="text"
                    value={suggestForm.location}
                    onChange={e => setSuggestForm({ ...suggestForm, location: e.target.value })}
                    placeholder="e.g. Franschhoek / Wilderness"
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#9c2743] focus:outline-none focus:ring-1 focus:ring-[#9c2743]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSuggestModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#9c2743] to-[#c94d6e] px-5 py-2 text-xs font-bold text-white shadow-md hover:from-[#872039] hover:to-[#b0405e] transition"
                >
                  Post Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
