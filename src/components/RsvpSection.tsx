import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  CheckCircle2,
  Gift,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { type HouseholdView, useGuestExperience } from './guestExperience';
import { TableSeatingChart } from './TableSeatingChart';
import { TulipDuo, TulipCorner } from './decorations/TulipAccents';
import { PrintInvitationModal } from './PrintInvitationModal';
import { WEDDING_FAVOUR_OPTIONS } from '../utils/seatingConstants';
import { DIETARY_OPTIONS, normalizeDietary } from '../utils/dietary';

interface RsvpSectionProps {
  onNavigate: (section: SectionId) => void;
}

const INVITATION_SESSION_KEY = 'camabby_active_invitation';

export function RsvpSection({ onNavigate }: RsvpSectionProps) {
  const {
    activeHousehold,
    loading,
    lookupInvitation,
    submitHouseholdRsvp,
    clearInvitation,
    households,
  } = useGuestExperience();
  const [lookupResult, setLookupResult] = useState<HouseholdView | null>(null);
  const household = activeHousehold ?? lookupResult;
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || params.get('code') || params.get('invite')
      || window.sessionStorage.getItem(INVITATION_SESSION_KEY) || '';
  });
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [response, setResponse] = useState<'attending' | 'declined'>('attending');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [plusOneAttending, setPlusOneAttending] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [memberDietary, setMemberDietary] = useState<Record<string, { restrictions: string[]; details: string }>>({});
  const [foodDrinkPreferences, setFoodDrinkPreferences] = useState('');
  const [weddingFavour, setWeddingFavour] = useState<string>('Stroopwaffels');
  const [tableNumber, setTableNumber] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const autoLookupAttempted = useRef(false);
  const initializedHouseholdId = useRef<string | null>(null);

  useEffect(() => {
    if (!household || initializedHouseholdId.current === household.id) return;
    initializedHouseholdId.current = household.id;
    const attendingIds = household.members.filter(member => member.attending).map(member => member.id);
    setSelectedMembers(attendingIds.length ? attendingIds : household.members.map(member => member.id));
    setResponse(household.status === 'declined' ? 'declined' : 'attending');
    setEmail(household.email);
    setPhone(household.phone);

    // Initialize plus-one state
    const companionName = household.companionNames?.[0] || household.members.find(m => !m.isPrimary)?.name || '';
    const hasCompanion = Boolean(
      (household.companionNames && household.companionNames.length > 0) ||
      household.members.some(m => !m.isPrimary && m.attending)
    );
    setPlusOneAttending(hasCompanion);
    setPlusOneName(companionName);

    // Initialize dietary state per member with intelligent normalization
    const householdNorm = normalizeDietary(household.dietaryRestrictions, household.dietaryDetails);
    const initialDietaryMap: Record<string, { restrictions: string[]; details: string }> = {};

    household.members.forEach(m => {
      const mNorm = normalizeDietary(m.dietaryRestrictions, m.dietaryDetails);
      const restrictions = mNorm.tags.length > 0
        ? mNorm.tags.map(t => t.id)
        : householdNorm.tags.map(t => t.id);
      const details = mNorm.notes || (mNorm.tags.length === 0 ? householdNorm.notes || '' : '');
      initialDietaryMap[m.id] = { restrictions, details };
    });

    initialDietaryMap['plus-one'] = {
      restrictions: [],
      details: '',
    };

    setMemberDietary(initialDietaryMap);
    setFoodDrinkPreferences(household.mealSelection || '');
    if (household.songRequest) {
      setWeddingFavour(household.songRequest);
    }
    setTableNumber(household.tableNumber || '');
    setMessage(household.message || '');
    setSaved(false);
    setCurrentStep(1);
  }, [household]);

  const toggleDietaryRestriction = (key: string, restrictionId: string) => {
    setMemberDietary(prev => {
      const current = prev[key] || { restrictions: [], details: '' };
      const exists = current.restrictions.includes(restrictionId);
      const updatedRestrictions = exists
        ? current.restrictions.filter(r => r !== restrictionId)
        : [...current.restrictions, restrictionId];
      return {
        ...prev,
        [key]: {
          ...current,
          restrictions: updatedRestrictions,
        },
      };
    });
  };

  const clearDietaryRestrictions = (key: string) => {
    setMemberDietary(prev => ({
      ...prev,
      [key]: {
        restrictions: [],
        details: '',
      },
    }));
  };

  const updateDietaryDetails = (key: string, details: string) => {
    setMemberDietary(prev => {
      const current = prev[key] || { restrictions: [], details: '' };
      return {
        ...prev,
        [key]: {
          ...current,
          details,
        },
      };
    });
  };

  const copyDietaryToAll = (fromKey: string) => {
    const source = memberDietary[fromKey] || { restrictions: [], details: '' };
    setMemberDietary(prev => {
      const next: Record<string, { restrictions: string[]; details: string }> = {};
      for (const k of Object.keys(prev)) {
        next[k] = {
          restrictions: [...source.restrictions],
          details: source.details,
        };
      }
      return next;
    });
  };

  const findInvitation = useCallback(async (invitationCode: string) => {
    const cleanCode = invitationCode.trim();
    if (!cleanCode) {
      setLookupError('Enter the private code or token from your invitation.');
      return;
    }

    setLookupPending(true);
    setLookupError('');
    try {
      const result = await lookupInvitation(cleanCode);
      if (!result) {
        setLookupError('We couldn’t verify that invitation. Check the code and try again.');
        return;
      }
      setLookupResult(result);
      window.sessionStorage.setItem(INVITATION_SESSION_KEY, cleanCode);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      cleanUrl.searchParams.delete('code');
      cleanUrl.searchParams.delete('invite');
      cleanUrl.hash = 'rsvp';
      window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    } catch {
      setLookupError('We couldn’t verify that invitation right now. Please try again shortly.');
    } finally {
      setLookupPending(false);
    }
  }, [lookupInvitation]);

  useEffect(() => {
    if (!code || household || autoLookupAttempted.current) return;
    autoLookupAttempted.current = true;
    void findInvitation(code);
  }, [code, findInvitation, household]);

  const attendingCount = response === 'attending'
    ? selectedMembers.length + (household?.isPlusOneAllowed && plusOneAttending ? 1 : 0)
    : 0;
  const selectedMemberSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);

  const attendingMemberNames = useMemo(() => {
    if (!household || response !== 'attending') return [];
    const names = household.members
      .filter(m => selectedMemberSet.has(m.id))
      .map(m => m.name);
    if (household.isPlusOneAllowed && plusOneAttending) {
      names.push(plusOneName.trim() || `${household.name}'s Guest (+1)`);
    }
    return names;
  }, [household, response, selectedMemberSet, plusOneAttending, plusOneName]);

  const attendingGuestsList = useMemo(() => {
    if (!household || response !== 'attending') return [];
    const list: Array<{ key: string; name: string; isPrimary: boolean; isPlusOne?: boolean }> = [];
    household.members.forEach(m => {
      if (selectedMemberSet.has(m.id)) {
        list.push({ key: m.id, name: m.name, isPrimary: Boolean(m.isPrimary) });
      }
    });
    if (household.isPlusOneAllowed && plusOneAttending) {
      list.push({
        key: 'plus-one',
        name: plusOneName.trim() || `${household.name}'s Guest (+1)`,
        isPrimary: false,
        isPlusOne: true,
      });
    }
    return list;
  }, [household, response, selectedMemberSet, plusOneAttending, plusOneName]);

  const toggleMember = (id: string) => {
    setSelectedMembers(current =>
      current.includes(id) ? current.filter(memberId => memberId !== id) : [...current, id],
    );
  };

  const handleNextFromStep1 = () => {
    setSubmitError('');
    if (response === 'attending' && attendingCount === 0) {
      setSubmitError('Select at least one guest who will attend, or choose “Unable to attend”.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setSubmitError('');
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    setSubmitError('');
    setCurrentStep(4);
  };

  const saveResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentStep !== 4) {
      if (currentStep === 1) handleNextFromStep1();
      else if (currentStep === 2) handleNextFromStep2();
      else if (currentStep === 3) handleNextFromStep3();
      return;
    }

    if (!household) return;
    if (response === 'attending' && attendingCount === 0) {
      setSubmitError('Select at least one guest who will attend, or choose “Unable to attend”.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const submittedMembers: Array<{
        id?: string;
        memberId?: string;
        name: string;
        attending: boolean;
        dietaryRestrictions?: string[];
        dietaryDetails?: string;
      }> = household.members.map(member => {
        const isAttending = response === 'attending' && selectedMemberSet.has(member.id);
        const diet = memberDietary[member.id] || { restrictions: [], details: '' };
        return {
          id: member.id,
          memberId: member.id,
          name: member.name,
          attending: isAttending,
          dietaryRestrictions: isAttending ? diet.restrictions : [],
          dietaryDetails: isAttending && diet.details.trim() ? diet.details.trim() : undefined,
        };
      });

      if (household.isPlusOneAllowed && plusOneAttending && response === 'attending') {
        const plusOneDiet = memberDietary['plus-one'] || { restrictions: [], details: '' };
        submittedMembers.push({
          name: plusOneName.trim() || `${household.name}'s Guest (+1)`,
          attending: true,
          dietaryRestrictions: plusOneDiet.restrictions,
          dietaryDetails: plusOneDiet.details.trim() || undefined,
        });
      }

      const attendingSubmitted = submittedMembers.filter(m => m.attending);
      const allHouseholdRestrictions = Array.from(
        new Set(attendingSubmitted.flatMap(m => m.dietaryRestrictions || []))
      );
      const allHouseholdDetails = Array.from(
        new Set(attendingSubmitted.map(m => m.dietaryDetails).filter(Boolean))
      ).join(', ');

      const result = await submitHouseholdRsvp(household.id, {
        rsvpStatus: response,
        attendingCount,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dietaryRestrictions: allHouseholdRestrictions,
        dietaryDetails: allHouseholdDetails || undefined,
        mealSelection: foodDrinkPreferences.trim() || undefined,
        songRequest: weddingFavour || undefined,
        message: message.trim() || undefined,
        tableNumber: response === 'attending' ? tableNumber.trim() || undefined : undefined,
        members: submittedMembers,
      });
      if (result === false) throw new Error('RSVP was not saved');
      setSaved(true);
      if (response === 'attending') {
        try {
          void confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#fbcfe8', '#f472b6', '#fed7aa', '#bbf7d0', '#e9d5ff', '#c97a8b'],
          });
        } catch {
          // ignore if canvas not supported
        }
      }
    } catch {
      setSubmitError('Your response wasn’t saved. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const useAnotherInvitation = () => {
    clearInvitation();
    initializedHouseholdId.current = null;
    window.sessionStorage.removeItem(INVITATION_SESSION_KEY);
    setLookupResult(null);
    setCode('');
    setLookupError('');
    setTableNumber('');
    setSaved(false);
    const cleanUrl = `${window.location.pathname}#rsvp`;
    window.history.replaceState(null, '', cleanUrl);
  };

  return (
    <section id="rsvp" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] overflow-hidden bg-gradient-to-b from-transparent via-[#fff5f1]/50 to-[#f7faf0]/50 px-5 pt-8 pb-32 sm:px-8 sm:pt-10 sm:pb-44">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="relative z-10 mb-8 max-w-2xl">
          <p className="eyebrow flex items-center gap-2">
            <TulipDuo size={22} className="drop-shadow-sm" />
            <span>Your invitation</span>
          </p>
          <h2 className="section-title">Celebrate with us</h2>
          <p className="section-copy mt-5">
            Use the private code on your invitation to open your household RSVP. Each invitation only shows the guests included in that household.
          </p>
        </Reveal>

        {!household ? (
          <Reveal delay={100} className="relative z-10 grid overflow-hidden rounded-[2rem] border-2 border-[#eed5dc] bg-gradient-to-br from-[#fffdfd] to-[#faf3f7] shadow-[0_24px_80px_rgba(201,122,139,0.12)] lg:grid-cols-[0.78fr_1.22fr]">
            <TulipCorner position="top-right" className="z-10 hidden sm:block" />
            <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-[#faecf0] via-[#fdf1ec] to-[#f4f7eb] p-8 text-stone-800 sm:p-10 border-b border-[#eed5dc] lg:border-b-0 lg:border-r">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-pink-300/40" />
              <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border border-pink-300/40" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-200 bg-white/90 text-[#b85b73] shadow-xs">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h3 className="relative mt-12 max-w-xs font-display text-4xl leading-tight text-stone-900 font-semibold">A private moment, made simple.</h3>
              <p className="relative mt-4 max-w-sm text-sm leading-7 text-stone-700">
                Your code securely connects you to the correct household and guest list. There is no public name search or self-registration.
              </p>
            </div>

            <form
              className="flex flex-col justify-center p-7 sm:p-12"
              onSubmit={event => {
                event.preventDefault();
                void findInvitation(code);
              }}
            >
              <label htmlFor="invitation-code" className="text-sm font-semibold text-stone-800">Invitation code or token</label>
              <p className="mb-4 mt-1 text-xs leading-5 text-stone-500">Enter it exactly as shown on your invitation.</p>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  id="invitation-code"
                  type="text"
                  value={code}
                  onChange={event => setCode(event.target.value)}
                  placeholder="e.g. Anr-658"
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="form-field pl-12 font-mono uppercase tracking-[0.12em]"
                  aria-describedby={lookupError ? 'invitation-error' : 'invitation-privacy'}
                  aria-invalid={Boolean(lookupError)}
                />
              </div>
              <p id="invitation-privacy" className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
                <LockKeyhole className="h-3.5 w-3.5" /> Keep this code private—it is unique to your household.
              </p>
              {lookupError && (
                <p id="invitation-error" role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {lookupError}
                </p>
              )}
              <button type="submit" disabled={lookupPending || loading} className="button-primary mt-6 min-h-12 w-full justify-center disabled:cursor-wait disabled:opacity-60">
                {lookupPending || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {lookupPending || loading ? 'Checking invitation…' : 'Open invitation'}
              </button>

              <div className="mt-5 border-t border-stone-200/80 pt-4 text-center">
                <p className="text-[11px] font-semibold text-stone-500">Quick Test Codes:</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setCode('Anr-658'); void findInvitation('Anr-658'); }}
                    className="rounded-full bg-[#fdf2f4] border border-[#f1aab7] px-2.5 py-1 font-mono text-[10px] font-bold text-[#8a2947] transition hover:bg-[#fce5ea]"
                    title="Test Custom Household Code"
                  >
                    Anr-658 (Anri & Henk)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('Cam-101'); void findInvitation('Cam-101'); }}
                    className="rounded-full bg-[#f6faf8] border border-[#c0dccc]/50 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#3b6b55] transition hover:bg-[#eaf4ef]"
                    title="Test Standard Attending RSVP"
                  >
                    Cam-101 (Cam & Abby)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('Vip-204'); void findInvitation('Vip-204'); }}
                    className="rounded-full bg-[#fdf5f6] border border-[#e4aeb5]/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#8a424e] transition hover:bg-[#fcecef]"
                    title="Test VIP Stay (tag: free_venue_housing)"
                  >
                    Vip-204 (VIP Venue Stay)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('Clo-305'); void findInvitation('Clo-305'); }}
                    className="rounded-full bg-[#f4f8f5] border border-[#9bbeab]/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#385e49] transition hover:bg-[#e7f1eb]"
                    title="Test No Gifts (tag: presence_is_our_gift)"
                  >
                    Clo-305 (No Gifts Message)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('Dav-402'); void findInvitation('Dav-402'); }}
                    className="rounded-full bg-[#fdf5f2] border border-[#e7af9e]/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#854231] transition hover:bg-[#fbe9e3]"
                    title="Test Pending RSVP with multi-member checklist"
                  >
                    Dav-402 (Pending RSVP)
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        ) : saved ? (
          <Reveal className="relative z-10 mx-auto max-w-3xl rounded-[2rem] border border-[#b8cfb6] bg-[#edf6ec] p-8 text-center shadow-[0_20px_60px_rgba(76,107,75,0.08)] sm:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#5c7a59] text-white shadow-lg">
              <Check className="h-7 w-7" strokeWidth={2} />
            </span>
            <p className="eyebrow mt-6 text-[#4c6b4b]">Response saved</p>
            <h3 className="mt-2 font-display text-4xl text-stone-800 sm:text-5xl">
              {response === 'attending' ? 'We can’t wait to welcome you.' : 'Thank you for letting us know.'}
            </h3>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-600">
              {response === 'attending'
                ? `${attendingCount} ${attendingCount === 1 ? 'guest is' : 'guests are'} confirmed for ${household.name}. Your private stay and gift details are now available below.`
                : `We’ll miss you, but we’re grateful you responded for ${household.name}.`}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {response === 'attending' && (
                <button type="button" className="button-primary min-h-11 px-6" onClick={() => onNavigate('details')}>
                  View guest details <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button type="button" className="button-secondary min-h-11 px-6" onClick={() => { setSaved(false); setCurrentStep(1); }}>
                <RefreshCw className="h-4 w-4" /> Update response
              </button>
            </div>
          </Reveal>
        ) : (
          <Reveal className="relative z-10 grid gap-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(64,48,39,0.09)] sm:p-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
            <aside className="rounded-[1.5rem] bg-[#fdf3f5] p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c97a8b]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Invitation verified
              </span>
              <h3 className="mt-5 font-display text-3xl leading-tight text-stone-800">{household.name}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {household.isPlusOneAllowed
                  ? `${household.members.length} ${household.members.length === 1 ? 'guest' : 'guests'} + 1 companion included in this invitation.`
                  : `${household.members.length} ${household.members.length === 1 ? 'guest' : 'guests'} included in this invitation.`}
              </p>
              {household.status !== 'pending' && (
                <p className="mt-5 rounded-2xl border border-pink-200/80 bg-white/70 px-4 py-3 text-xs leading-5 text-stone-600">
                  A response is already saved. Submitting this form will update it.
                </p>
              )}
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f1aab7] bg-white px-4 py-2.5 text-xs font-bold text-[#9c3353] shadow-xs hover:bg-[#fff5f7] transition"
                >
                  <CalendarHeart className="h-4 w-4 text-[#db6b88]" />
                  View custom invitation card
                </button>
                <button type="button" onClick={useAnotherInvitation} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900">
                  <RefreshCw className="h-3.5 w-3.5" /> Use another invitation
                </button>
              </div>
            </aside>

            <form onSubmit={saveResponse} className="flex flex-col justify-between">
              {/* Step Progress Bar */}
              <nav aria-label="RSVP Steps" className="mb-8">
                <ol className="flex items-center justify-between gap-2 border-b border-pink-100/80 pb-5">
                  {[
                    { step: 1 as const, label: 'Attendance', hint: 'Who’s coming' },
                    { step: 2 as const, label: 'Preferences', hint: 'Dietary & favours' },
                    { step: 3 as const, label: 'Table Seating', hint: 'Floor plan' },
                    { step: 4 as const, label: 'Summary', hint: 'Review & submit' },
                  ].map(item => {
                    const isActive = currentStep === item.step;
                    const isCompleted = currentStep > item.step;
                    return (
                      <li key={item.step} className="flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.step === 1) {
                              setCurrentStep(1);
                            } else if (response === 'attending' && attendingCount === 0) {
                              setSubmitError('Select at least one attending guest before continuing.');
                            } else {
                              setSubmitError('');
                              setCurrentStep(item.step);
                            }
                          }}
                          className={`group flex w-full flex-col gap-1 text-left transition-all ${
                            isActive ? 'opacity-100' : 'opacity-65 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-colors ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#e597a8] to-[#f7ada0] text-white shadow-sm'
                                  : isCompleted
                                  ? 'bg-[#f7faf2] text-[#4a6328] border border-[#cde1a4]'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : item.step}
                            </span>
                            <span className={`text-xs font-semibold tracking-wide ${isActive ? 'text-[#a84b61]' : 'text-stone-700'}`}>
                              {item.label}
                            </span>
                          </div>
                          <div
                            className={`mt-2 h-1 w-full rounded-full transition-colors ${
                              isActive ? 'bg-gradient-to-r from-[#e597a8] to-[#f7ada0]' : isCompleted ? 'bg-[#cde1a4]' : 'bg-stone-200/70'
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              {/* SLIDE 1: Attendance & Guests */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <fieldset>
                    <legend className="text-sm font-semibold text-stone-800">Will your household attend?</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setResponse('attending')}
                        aria-pressed={response === 'attending'}
                        className={`response-choice ${response === 'attending' ? 'is-selected' : ''}`}
                      >
                        <Check className="h-5 w-5" /> We’ll be there
                      </button>
                      <button
                        type="button"
                        onClick={() => setResponse('declined')}
                        aria-pressed={response === 'declined'}
                        className={`response-choice ${response === 'declined' ? 'is-selected' : ''}`}
                      >
                        <X className="h-5 w-5" /> Unable to attend
                      </button>
                    </div>
                  </fieldset>

                  {response === 'attending' ? (
                    <fieldset>
                      <legend className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                        <Users className="h-4 w-4 text-[#5c7a59]" /> Who will join us?
                      </legend>
                      <p className="mt-1 text-xs text-stone-500">Select each person in your household who will attend.</p>
                      <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
                        {household.members.map(member => {
                          const checked = selectedMemberSet.has(member.id);
                          return (
                            <label key={member.id} className="flex min-h-14 cursor-pointer items-center gap-3 bg-white px-4 transition-colors hover:bg-stone-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMember(member.id)}
                                className="h-4 w-4 rounded border-pink-200 text-[#5c7a59] focus:ring-[#9cb59b]"
                              />
                              <span className="flex-1 text-sm font-medium text-stone-700">{member.name}</span>
                              <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${checked ? 'text-[#4c6b4b]' : 'text-stone-400'}`}>
                                {checked ? 'Attending' : 'Not attending'}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {household.isPlusOneAllowed && (
                        <div className="mt-4 rounded-2xl border border-pink-100 bg-[#fdfafb] p-4 transition-all">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={plusOneAttending}
                              onChange={e => setPlusOneAttending(e.target.checked)}
                              className="h-4 w-4 rounded border-pink-200 text-[#5c7a59] focus:ring-[#9cb59b]"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-stone-800">Bring a Guest (+1 Companion)</span>
                                <span className="rounded bg-[#fdebf0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#b8697a]">+1 Included</span>
                              </div>
                              <p className="text-[11px] text-stone-500">Your invitation allows an accompanying guest.</p>
                            </div>
                            <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${plusOneAttending ? 'text-[#4c6b4b]' : 'text-stone-400'}`}>
                              {plusOneAttending ? 'Attending' : 'Not attending'}
                            </span>
                          </label>

                          {plusOneAttending && (
                            <div className="mt-3 border-t border-pink-100 pt-3">
                              <label className="block text-xs font-semibold text-stone-700">
                                Companion Full Name <span className="font-normal text-stone-400">(optional)</span>
                                <input
                                  type="text"
                                  value={plusOneName}
                                  onChange={e => setPlusOneName(e.target.value)}
                                  placeholder="e.g. Partner or Guest Name"
                                  className="form-field mt-1 text-xs"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </fieldset>
                  ) : (
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 text-sm text-stone-600">
                      <p className="font-medium text-stone-800">We’ll miss celebrating with you!</p>
                      <p className="mt-1 text-xs text-stone-500">
                        On the next page, you can update your contact information or leave a message for Abby &amp; Cam.
                      </p>
                    </div>
                  )}

                  {submitError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNextFromStep1}
                      className="button-primary min-h-12 w-full justify-center"
                    >
                      {response === 'attending' ? 'Next: Preferences & Favours' : 'Next: Contact & Message'} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Dietary, Food/Drinks, Wedding Favour, Contact & Message */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {response === 'attending' && (
                    <>
                      {/* Dietary requirements & allergies */}
                      <div className="rounded-2xl border border-[#9bbeab]/40 bg-gradient-to-br from-[#f8faf9] to-[#edf6f1]/40 p-4 sm:p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200/60 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#9bbeab]/20 text-[#214f38] text-xs">
                                🥗
                              </span>
                              <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                Dietary Requirements &amp; Allergies
                              </h5>
                              <span className="text-[11px] font-normal text-stone-400">(optional)</span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600">
                              Tick any dietary preferences or allergies below so our caterers can prepare a wonderful meal for you.
                            </p>
                          </div>
                          {attendingGuestsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => copyDietaryToAll(attendingGuestsList[0]?.key || '')}
                              className="shrink-0 text-[11px] font-semibold text-[#8a384b] hover:text-[#6f2537] hover:underline self-start sm:self-auto cursor-pointer"
                              title="Copy first guest's dietary settings to all guests"
                            >
                              📋 Copy to all guests
                            </button>
                          )}
                        </div>

                        {/* List of attending guests */}
                        <div className="space-y-4">
                          {attendingGuestsList.map((guest, gIdx) => {
                            const diet = memberDietary[guest.key] || { restrictions: [], details: '' };
                            const hasMultiple = attendingGuestsList.length > 1;

                            return (
                              <div
                                key={guest.key}
                                className={`space-y-3 ${
                                  hasMultiple
                                    ? 'rounded-2xl border border-stone-200/80 bg-white p-3.5 sm:p-4 shadow-2xs'
                                    : ''
                                }`}
                              >
                                {hasMultiple && (
                                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="grid h-5 w-5 place-items-center rounded-full bg-pink-100 text-[#8a384b] text-[11px] font-bold">
                                        {gIdx + 1}
                                      </span>
                                      <span className="text-xs font-bold text-stone-800">{guest.name}</span>
                                      {guest.isPlusOne && (
                                        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 font-medium">
                                          +1 Guest
                                        </span>
                                      )}
                                    </div>
                                    {(diet.restrictions.length > 0 || diet.details) && (
                                      <button
                                        type="button"
                                        onClick={() => clearDietaryRestrictions(guest.key)}
                                        className="text-[10px] font-semibold text-stone-400 hover:text-red-600 cursor-pointer"
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Buttons they can tick */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-700 mb-2">
                                    {hasMultiple ? `Requirements for ${guest.name}:` : 'Select all that apply:'}
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map(opt => {
                                      const isSelected = diet.restrictions.includes(opt.id);
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => toggleDietaryRestriction(guest.key, opt.id)}
                                          aria-pressed={isSelected}
                                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shadow-2xs cursor-pointer select-none ${
                                            isSelected
                                              ? `${opt.activeBg} ring-2 ring-offset-1 ring-[#9bbeab]/40 scale-[1.02]`
                                              : 'border-stone-200 bg-white text-stone-700 hover:border-[#9bbeab] hover:bg-[#edf6f1]/60'
                                          }`}
                                        >
                                          <span className="text-sm leading-none">{opt.icon}</span>
                                          <span>{opt.label}</span>
                                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Extra bar for Other */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-700">
                                    Other dietary requirements, allergies, or notes <span className="font-normal text-stone-400">(optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={diet.details}
                                    onChange={e => updateDietaryDetails(guest.key, e.target.value)}
                                    placeholder="e.g. No mushrooms, allium allergy, pregnancy, carries EpiPen..."
                                    className="form-field mt-1.5 text-xs bg-white"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Food & Drinks preferences */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          What type of food or drinks would you like to see at the venue? <span className="font-normal text-stone-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={foodDrinkPreferences}
                          onChange={e => setFoodDrinkPreferences(e.target.value)}
                          placeholder="e.g. Favorite cocktails, mocktails, sweet or savory treats..."
                          className="form-field mt-1.5 text-xs"
                        />
                      </div>

                      {/* Wedding favour choice */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          What type of wedding favour would you like?
                        </label>
                        <p className="mt-0.5 text-[11px] text-stone-500">Pick the keepsake or treat you would love to take home with you:</p>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          {WEDDING_FAVOUR_OPTIONS.map(option => {
                            const isSelected = weddingFavour === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setWeddingFavour(option.id)}
                                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                                  isSelected
                                    ? 'border-[#c97a8b] bg-[#fdf2f4] shadow-sm ring-1 ring-[#c97a8b]'
                                    : 'border-stone-200 bg-white hover:border-pink-200 hover:bg-[#fdfafb]'
                                }`}
                              >
                                <span className="text-2xl">{option.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#c97a8b]' : 'text-stone-800'}`}>
                                    {option.label}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-stone-500 leading-snug">
                                    {option.description}
                                  </p>
                                </div>
                                <div className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                                  isSelected ? 'border-[#c97a8b] bg-[#c97a8b] text-white' : 'border-stone-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Contact details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-stone-700">
                      Email <span className="font-normal text-stone-400">(optional)</span>
                      <span className="relative mt-1.5 block">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={event => setEmail(event.target.value)}
                          placeholder="add if not already here"
                          className="form-field pl-10 text-xs"
                          autoComplete="email"
                        />
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-stone-700">
                      Phone <span className="font-normal text-stone-400">(optional)</span>
                      <span className="relative mt-1.5 block">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={event => setPhone(event.target.value)}
                          placeholder="add if not already here"
                          className="form-field pl-10 text-xs"
                          autoComplete="tel"
                        />
                      </span>
                    </label>
                  </div>

                  {/* Message for Abby and Cam */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">
                      Message for Abby &amp; Cam <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Share a wish, note, or song recommendation for Abby &amp; Cam…"
                      className="form-field mt-1.5 text-xs"
                    />
                  </div>

                  {submitError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="button-secondary min-h-12 px-6 justify-center"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Attendance
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFromStep2}
                      className="button-primary min-h-12 px-6 justify-center"
                    >
                      Next: Table Seating <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Table Seating & Final Confirmation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {response === 'attending' ? (
                    <TableSeatingChart
                      currentHouseholdId={household.id}
                      currentHouseholdName={household.name}
                      attendingCount={attendingCount}
                      attendingMembers={attendingMemberNames}
                      households={households}
                      value={tableNumber}
                      onChange={setTableNumber}
                    />
                  ) : (
                    <div className="rounded-[1.75rem] border border-pink-100 bg-gradient-to-br from-[#fdfafb] to-[#fcf5f7] p-6 sm:p-8 text-center shadow-sm">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fdebf0] text-[#c97a8b] shadow-sm">
                        <Utensils className="h-6 w-6" />
                      </div>
                      <h4 className="mt-4 font-display text-2xl font-semibold text-stone-800 sm:text-3xl">
                        Table Seating
                      </h4>
                      <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-stone-600 sm:text-sm">
                        Since you let us know that you are unable to attend, no table seating selection is needed.
                        We will miss you dearly on our special day!
                      </p>
                      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8697a]">
                        <TulipDuo size={18} />
                        <span>Sending warm love</span>
                      </div>
                    </div>
                  )}

                  {submitError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="button-secondary min-h-12 px-6 justify-center"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Preferences
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFromStep3}
                      className="button-primary min-h-12 px-8 justify-center"
                    >
                      Next: Review Summary <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 4: Full RSVP Summary & Submission */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Title & Introduction */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b8697a]">
                      <Sparkles className="h-4 w-4" />
                      <span>Review &amp; Confirm</span>
                    </div>
                    <h4 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-stone-800">
                      Your RSVP Summary
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Please review your details and choices below before submitting your response.
                    </p>
                  </div>

                  {/* Comprehensive Summary Cards */}
                  <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-br from-white via-[#fffdfd] to-[#faf4f6] p-5 sm:p-7 shadow-sm space-y-5">
                    {/* 1. Attendance Card */}
                    <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                            response === 'attending' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800">Attendance</p>
                            <p className="text-[11px] text-stone-500">
                              {response === 'attending' ? `${attendingCount} ${attendingCount === 1 ? 'Guest' : 'Guests'} Attending` : 'Unable to Attend'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="mt-3.5">
                        {response === 'attending' ? (
                          <div className="flex flex-wrap gap-2">
                            {attendingMemberNames.map(name => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs"
                              >
                                <Check className="h-3 w-3 text-emerald-600" />
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-600 italic">
                            You’ve let Cam and Abby know that you won’t be able to celebrate in person.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2. Table & Seating Card (if attending) */}
                    {response === 'attending' && (
                      <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-[#b8697a]">
                              <Utensils className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-800">Table &amp; Seat Assignment</p>
                              <p className="text-[11px] text-stone-500">Dining room floor plan</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                          >
                            Change Seats
                          </button>
                        </div>
                        <div className="mt-3.5">
                          {tableNumber ? (
                            <div className="rounded-xl border border-pink-200/80 bg-[#fdf8f9] p-3">
                              <p className="text-sm font-bold text-[#b8697a]">
                                {tableNumber}
                              </p>
                              <p className="mt-0.5 text-[11px] text-stone-500">
                                Reserved for your party on the interactive seating chart.
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-3">
                              <p className="text-xs font-medium text-stone-700">
                                Cam &amp; Abby will assign seats for your party
                              </p>
                              <p className="mt-0.5 text-[11px] text-stone-500">
                                No specific seats chosen; the couple will assign great seats for you!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. Wedding Favour (if attending) */}
                    {response === 'attending' && (
                      <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-[#b8697a]">
                              <Gift className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-800">Wedding Favour</p>
                              <p className="text-[11px] text-stone-500">Selected wedding keepsake</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="mt-3.5 flex items-center gap-3">
                          <span className="text-2xl">
                            {WEDDING_FAVOUR_OPTIONS.find(o => o.id === weddingFavour)?.emoji || '🎁'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              {weddingFavour}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {WEDDING_FAVOUR_OPTIONS.find(o => o.id === weddingFavour)?.description || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Dietary & Food Wishes (if attending) */}
                    {response === 'attending' && (
                      <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-[#b8697a]">
                              <Utensils className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-800">Dietary &amp; Food Wishes</p>
                              <p className="text-[11px] text-stone-500">Venue catering details</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="mt-3.5 space-y-3 text-xs">
                          {attendingGuestsList.map(guest => {
                            const diet = memberDietary[guest.key] || { restrictions: [], details: '' };
                            const norm = normalizeDietary(diet.restrictions, diet.details);
                            return (
                              <div key={guest.key} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                                <span className="font-semibold text-stone-700 min-w-[120px]">{guest.name}:</span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {norm.tags.length > 0 ? (
                                    norm.tags.map(tag => (
                                      <span
                                        key={tag.id}
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${tag.badgeBg} ${tag.badgeText} ${tag.badgeBorder}`}
                                      >
                                        <span>{tag.icon}</span>
                                        <span>{tag.label}</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-stone-400 italic text-[11px]">Standard menu</span>
                                  )}
                                  {norm.notes && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200">
                                      📝 {norm.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {foodDrinkPreferences && (
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 pt-2 border-t border-stone-100">
                              <span className="font-semibold text-stone-700 min-w-[120px]">Drinks &amp; Treats:</span>
                              <span className="text-stone-800 bg-stone-50 rounded-lg px-2.5 py-1 border border-stone-100 font-medium">
                                {foodDrinkPreferences}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Contact Information */}
                    <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-[#b8697a]">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800">Contact Details</p>
                            <p className="text-[11px] text-stone-500">Updates &amp; coordination</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-3.5 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-stone-400" />
                          <span className="text-stone-700 font-medium">{email || <span className="text-stone-400 italic">No email provided</span>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-stone-400" />
                          <span className="text-stone-700 font-medium">{phone || <span className="text-stone-400 italic">No phone provided</span>}</span>
                        </div>
                      </div>
                    </div>

                    {/* 6. Message for Abby & Cam */}
                    {message && (
                      <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-[#b8697a]">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-800">Message for Abby &amp; Cam</p>
                              <p className="text-[11px] text-stone-500">Your personal note</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs font-semibold text-[#b8697a] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="mt-3.5 rounded-xl border border-pink-100/80 bg-[#fefbfc] p-3.5 text-xs text-stone-700 italic leading-relaxed">
                          “{message}”
                        </div>
                      </div>
                    )}
                  </div>

                  {submitError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}

                  {/* Submission Action Buttons */}
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="button-secondary min-h-12 px-6 justify-center"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Table Seating
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="button-primary min-h-12 px-8 justify-center disabled:cursor-wait disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {submitting ? 'Saving your response…' : household.status === 'pending' ? 'Submit RSVP' : 'Update RSVP'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </Reveal>
        )}
      </div>
      {household && (
        <PrintInvitationModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          household={{
            id: household.id,
            name: household.name,
            inviteCode: household.inviteCode,
            email: household.email,
            phone: household.phone,
          }}
          invitationType="official"
        />
      )}
    </section>
  );
}
