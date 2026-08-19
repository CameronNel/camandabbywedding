import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
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
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { type HouseholdView, useGuestExperience } from './guestExperience';

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
  const [response, setResponse] = useState<'attending' | 'declined'>('attending');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
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
    setSaved(false);
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

  const attendingCount = response === 'attending' ? selectedMembers.length : 0;
  const selectedMemberSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);

  const toggleMember = (id: string) => {
    setSelectedMembers(current =>
      current.includes(id) ? current.filter(memberId => memberId !== id) : [...current, id],
    );
  };

  const saveResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!household) return;
    if (response === 'attending' && attendingCount === 0) {
      setSubmitError('Select at least one guest who will attend, or choose “Unable to attend”.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitHouseholdRsvp(household.id, {
        rsvpStatus: response,
        attendingCount,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        members: household.members.map(member => ({
          id: member.id,
          memberId: member.id,
          name: member.name,
          attending: response === 'attending' && selectedMemberSet.has(member.id),
        })),
      });
      if (result === false) throw new Error('RSVP was not saved');
      setSaved(true);
      if (response === 'attending') {
        try {
          void confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#704b3d', '#a87b64', '#596651', '#d9c8b4', '#e8c5b2'],
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
    <section id="rsvp" className="anchor-section relative overflow-hidden bg-[#f8f5ef] px-5 py-24 sm:px-8 sm:py-32">
      <div className="paper-grain absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow">Your invitation</p>
          <h2 className="section-title">Celebrate with us</h2>
          <p className="section-copy mt-5">
            Use the private code on your invitation to open your household RSVP. Each invitation only shows the guests included in that household.
          </p>
        </Reveal>

        {!household ? (
          <Reveal delay={100} className="grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(64,48,39,0.09)] lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative min-h-64 overflow-hidden bg-[#485143] p-8 text-white sm:p-10">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border border-white/10" />
              <LockKeyhole className="relative h-8 w-8 text-[#d9c8b4]" />
              <h3 className="relative mt-16 max-w-xs font-display text-4xl leading-tight">A private moment, made simple.</h3>
              <p className="relative mt-4 max-w-sm text-sm leading-7 text-white/[0.68]">
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
            </form>
          </Reveal>
        ) : saved ? (
          <Reveal className="mx-auto max-w-3xl rounded-[2rem] border border-[#aeb9a4] bg-[#eef1e9] p-8 text-center shadow-[0_20px_60px_rgba(72,81,67,0.12)] sm:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#596651] text-white shadow-lg">
              <Check className="h-7 w-7" strokeWidth={2} />
            </span>
            <p className="eyebrow mt-6 text-[#596651]">Response saved</p>
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
              <button type="button" className="button-secondary min-h-11 px-6" onClick={() => setSaved(false)}>
                <RefreshCw className="h-4 w-4" /> Update response
              </button>
            </div>
          </Reveal>
        ) : (
          <Reveal className="grid gap-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(64,48,39,0.09)] sm:p-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
            <aside className="rounded-[1.5rem] bg-[#f0ebe3] p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#704b3d]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Invitation verified
              </span>
              <h3 className="mt-5 font-display text-3xl leading-tight text-stone-800">{household.name}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {household.members.length} {household.members.length === 1 ? 'guest' : 'guests'} included in this invitation.
              </p>
              {household.status !== 'pending' && (
                <p className="mt-5 rounded-2xl border border-[#c9bba8] bg-white/70 px-4 py-3 text-xs leading-5 text-stone-600">
                  A response is already saved. Submitting this form will update it.
                </p>
              )}
              <button type="button" onClick={useAnotherInvitation} className="mt-8 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900">
                <RefreshCw className="h-3.5 w-3.5" /> Use another invitation
              </button>
            </aside>

            <form onSubmit={saveResponse}>
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

              {response === 'attending' && (
                <fieldset className="mt-8">
                  <legend className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                    <Users className="h-4 w-4 text-[#7a8870]" /> Who will join us?
                  </legend>
                  <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
                    {household.members.map(member => {
                      const checked = selectedMemberSet.has(member.id);
                      return (
                        <label key={member.id} className="flex min-h-14 cursor-pointer items-center gap-3 bg-white px-4 transition-colors hover:bg-stone-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(member.id)}
                            className="h-4 w-4 rounded border-stone-300 text-[#596651] focus:ring-[#7a8870]"
                          />
                          <span className="flex-1 text-sm font-medium text-stone-700">{member.name}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{checked ? 'Attending' : 'Not attending'}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-stone-700">
                  Email <span className="font-normal text-stone-400">(optional)</span>
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input type="email" value={email} onChange={event => setEmail(event.target.value)} className="form-field pl-10" autoComplete="email" />
                  </span>
                </label>
                <label className="text-xs font-semibold text-stone-700">
                  Phone <span className="font-normal text-stone-400">(optional)</span>
                  <span className="relative mt-2 block">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input type="tel" value={phone} onChange={event => setPhone(event.target.value)} className="form-field pl-10" autoComplete="tel" />
                  </span>
                </label>
              </div>

              {submitError && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}

              <button type="submit" disabled={submitting} className="button-primary mt-7 min-h-12 w-full justify-center disabled:cursor-wait disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? 'Saving your response…' : household.status === 'pending' ? 'Send RSVP' : 'Update RSVP'}
              </button>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
}
