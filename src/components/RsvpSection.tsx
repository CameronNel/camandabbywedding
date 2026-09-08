import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { type HouseholdView, useGuestExperience } from './guestExperience';
import { TulipDuo, TulipCorner } from './decorations/TulipAccents';

interface RsvpSectionProps {
  onNavigate: (section: SectionId) => void;
}

const INVITATION_SESSION_KEY = 'camabby_active_invitation';

const WEDDING_FAVOUR_OPTIONS = [
  {
    id: 'Stroopwaffels',
    label: 'Stroopwaffels',
    description: 'Traditional Dutch Stroopwaffels',
    emoji: '🧇',
  },
  {
    id: 'Bubbles / Glasses',
    label: 'Bubbles / Glasses',
    description: 'Cool glasses or bubbles',
    emoji: '🫧',
  },
  {
    id: 'Something from the netherlands',
    label: 'Something from the netherlands',
    description: 'A special Dutch keepsake chosen with love',
    emoji: '🌷',
  },
  {
    id: 'Nothing',
    label: 'Nothing',
    description: 'Your presence is the only gift we need!',
    emoji: '🤍',
  },
] as const;

export function RsvpSection({ onNavigate }: RsvpSectionProps) {
  const {
    activeHousehold,
    loading,
    lookupInvitation,
    submitHouseholdRsvp,
    clearInvitation,
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [response, setResponse] = useState<'attending' | 'declined'>('attending');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [plusOneAttending, setPlusOneAttending] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [dietaryDetails, setDietaryDetails] = useState('');
  const [foodDrinkPreferences, setFoodDrinkPreferences] = useState('');
  const [weddingFavour, setWeddingFavour] = useState<string>('Stroopwaffels');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(false);
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
    setDietaryDetails(household.dietaryDetails || '');
    setFoodDrinkPreferences(household.mealSelection || '');
    if (household.songRequest) {
      setWeddingFavour(household.songRequest);
    }
    setMessage(household.message || '');
    setSaved(false);
    setCurrentStep(1);
  }, [household]);

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

  const saveResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentStep !== 3) {
      if (currentStep === 1) handleNextFromStep1();
      else if (currentStep === 2) handleNextFromStep2();
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
      const submittedMembers: Array<{ id?: string; memberId?: string; name: string; attending: boolean; dietaryDetails?: string }> = household.members.map(member => ({
        id: member.id,
        memberId: member.id,
        name: member.name,
        attending: response === 'attending' && selectedMemberSet.has(member.id),
        dietaryDetails: dietaryDetails.trim() || undefined,
      }));

      if (household.isPlusOneAllowed && plusOneAttending && response === 'attending') {
        submittedMembers.push({
          name: plusOneName.trim() || `${household.name}'s Guest (+1)`,
          attending: true,
          dietaryDetails: dietaryDetails.trim() || undefined,
        });
      }

      const result = await submitHouseholdRsvp(household.id, {
        rsvpStatus: response,
        attendingCount,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dietaryDetails: dietaryDetails.trim() || undefined,
        mealSelection: foodDrinkPreferences.trim() || undefined,
        songRequest: weddingFavour || undefined,
        message: message.trim() || undefined,
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
    setSaved(false);
    const cleanUrl = `${window.location.pathname}#rsvp`;
    window.history.replaceState(null, '', cleanUrl);
  };

  return (
    <section id="rsvp" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] overflow-hidden bg-transparent px-5 pt-8 pb-32 sm:px-8 sm:pt-10 sm:pb-44">
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
          <Reveal delay={100} className="relative z-10 grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(64,48,39,0.09)] lg:grid-cols-[0.78fr_1.22fr]">
            <TulipCorner position="top-right" className="z-10 hidden sm:block" />
            <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-[#6b7b68] to-[#556353] p-8 text-white sm:p-10">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border border-white/10" />
              <LockKeyhole className="relative h-8 w-8 text-[#fce4ec]" />
              <h3 className="relative mt-16 max-w-xs font-display text-4xl leading-tight">A private moment, made simple.</h3>
              <p className="relative mt-4 max-w-sm text-sm leading-7 text-white/[0.80]">
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
                  placeholder="e.g. CA-••••••"
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
                    onClick={() => { setCode('CA-VENUESTAY'); void findInvitation('CA-VENUESTAY'); }}
                    className="rounded-full bg-[#fdebf0] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#b8697a] transition hover:bg-[#fadce5]"
                    title="Test VIP Stay (tag: free_venue_housing)"
                  >
                    CA-VENUESTAY (VIP Venue Stay)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('CA-NOGIFTS01'); void findInvitation('CA-NOGIFTS01'); }}
                    className="rounded-full bg-[#edf6ec] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#4c6b4b] transition hover:bg-[#dff0dd]"
                    title="Test No Gifts (tag: presence_is_our_gift)"
                  >
                    CA-NOGIFTS01 (No Gifts Message)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('CA-CAMABBY1'); void findInvitation('CA-CAMABBY1'); }}
                    className="rounded-full bg-[#eaf2f8] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#486a85] transition hover:bg-[#dbe7f2]"
                    title="Test Standard Attending RSVP"
                  >
                    CA-CAMABBY1 (Cam & Abby)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode('CA-DAVIES27'); void findInvitation('CA-DAVIES27'); }}
                    className="rounded-full bg-[#f3edf8] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#6d4e82] transition hover:bg-[#e8ddf1]"
                    title="Test Pending RSVP with multi-member checklist"
                  >
                    CA-DAVIES27 (Pending RSVP)
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
              <button type="button" onClick={useAnotherInvitation} className="mt-8 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900">
                <RefreshCw className="h-3.5 w-3.5" /> Use another invitation
              </button>
            </aside>

            <form onSubmit={saveResponse} className="flex flex-col justify-between">
              {/* Step Progress Bar */}
              <nav aria-label="RSVP Steps" className="mb-8">
                <ol className="flex items-center justify-between gap-2 border-b border-pink-100/80 pb-5">
                  {[
                    { step: 1 as const, label: 'Attendance', hint: 'Who’s coming' },
                    { step: 2 as const, label: 'Preferences', hint: 'Dietary & favours' },
                    { step: 3 as const, label: 'Table Seating', hint: 'Seating & submit' },
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
                                  ? 'bg-[#c97a8b] text-white shadow-sm'
                                  : isCompleted
                                  ? 'bg-[#edf6ec] text-[#4c6b4b] border border-[#9cb59b]'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : item.step}
                            </span>
                            <span className={`text-xs font-semibold tracking-wide ${isActive ? 'text-[#c97a8b]' : 'text-stone-700'}`}>
                              {item.label}
                            </span>
                          </div>
                          <div
                            className={`mt-2 h-1 w-full rounded-full transition-colors ${
                              isActive ? 'bg-[#c97a8b]' : isCompleted ? 'bg-[#9cb59b]' : 'bg-stone-200/70'
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
                      {/* Dietary requirements */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Dietary requirements or allergies <span className="font-normal text-stone-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={dietaryDetails}
                          onChange={e => setDietaryDetails(e.target.value)}
                          placeholder="e.g. Vegetarian, Gluten-free, Nut allergy, Halal, None"
                          className="form-field mt-1.5 text-xs"
                        />
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
                  {/* Table Seating Placeholder Card */}
                  <div className="rounded-[1.75rem] border border-pink-100 bg-gradient-to-br from-[#fdfafb] to-[#fcf5f7] p-6 sm:p-8 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fdebf0] text-[#c97a8b] shadow-sm">
                      <Utensils className="h-6 w-6" />
                    </div>
                    <h4 className="mt-4 font-display text-2xl font-semibold text-stone-800 sm:text-3xl">
                      Table Seating
                    </h4>
                    {household.tableNumber ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#9cb59b] bg-[#edf6ec] px-4 py-1.5 text-xs font-semibold text-[#3b543a]">
                        <Check className="h-3.5 w-3.5" /> Assigned: Table {household.tableNumber}
                      </div>
                    ) : (
                      <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-stone-600 sm:text-sm">
                        Table arrangements and seating placement are being carefully curated by Abby &amp; Cameron.
                        Seating details will be published here as the wedding day approaches!
                      </p>
                    )}
                    <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8697a]">
                      <TulipDuo size={18} />
                      <span>Seating to follow</span>
                    </div>
                  </div>

                  {/* Summary of RSVP choices */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-5 text-xs text-stone-600 space-y-2.5">
                    <p className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">Response Summary</p>
                    <div className="flex justify-between border-b border-stone-100 pb-2">
                      <span className="text-stone-500">Attendance:</span>
                      <span className="font-semibold text-stone-800">
                        {response === 'attending' ? `Attending (${attendingCount} guest${attendingCount === 1 ? '' : 's'})` : 'Unable to attend'}
                      </span>
                    </div>
                    {response === 'attending' && (
                      <>
                        <div className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500">Wedding Favour:</span>
                          <span className="font-semibold text-[#c97a8b]">{weddingFavour}</span>
                        </div>
                        {dietaryDetails && (
                          <div className="flex justify-between border-b border-stone-100 pb-2">
                            <span className="text-stone-500">Dietary:</span>
                            <span className="font-semibold text-stone-800 truncate max-w-[200px]">{dietaryDetails}</span>
                          </div>
                        )}
                        {foodDrinkPreferences && (
                          <div className="flex justify-between border-b border-stone-100 pb-2">
                            <span className="text-stone-500">Food/Drink Wish:</span>
                            <span className="font-semibold text-stone-800 truncate max-w-[200px]">{foodDrinkPreferences}</span>
                          </div>
                        )}
                      </>
                    )}
                    {(email || phone) && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Contact:</span>
                        <span className="font-semibold text-stone-800">{[email, phone].filter(Boolean).join(' · ')}</span>
                      </div>
                    )}
                  </div>

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
    </section>
  );
}
