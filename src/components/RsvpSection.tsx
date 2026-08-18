import React, { useState, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';
import confetti from 'canvas-confetti';
import { generateIcsFile, getGoogleCalendarUrl } from '../utils/storage';
import { CutePrintButton } from './PrintInvitationModal';
import {
  Heart,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Utensils,
  Music,
  MessageSquareHeart,
  Sparkles,
  AlertCircle,
  QrCode,
  Download,
  ExternalLink,
  Edit3,
  UserPlus
} from 'lucide-react';

export const RsvpSection: React.FC = () => {
  const { config, searchGuest, submitRsvp, registerAndRsvp, activeGuest, setActiveGuest } = useWedding();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form State
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined'>('attending');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [attendingCount, setAttendingCount] = useState(1);
  const [maxPartySize, setMaxPartySize] = useState(2);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [mealSelection, setMealSelection] = useState(config.mealOptions[0]?.name || '');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [dietaryDetails, setDietaryDetails] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize form when activeGuest changes
  useEffect(() => {
    if (activeGuest) {
      setFullName(activeGuest.name);
      setEmail(activeGuest.email || '');
      setPhone(activeGuest.phone || '');
      setRsvpStatus(activeGuest.rsvpStatus === 'declined' ? 'declined' : 'attending');
      setMaxPartySize(activeGuest.partySize || 2);
      setAttendingCount(activeGuest.attendingCount > 0 ? activeGuest.attendingCount : 1);
      setCompanionNames(activeGuest.companionNames || []);
      setMealSelection(activeGuest.mealSelection || config.mealOptions[0]?.name || '');
      setDietaryRestrictions(activeGuest.dietaryRestrictions || []);
      setDietaryDetails(activeGuest.dietaryDetails || '');
      setSongRequest(activeGuest.songRequest || '');
      setMessage(activeGuest.message || '');
      if (activeGuest.rsvpStatus !== 'pending') {
        setIsSubmitted(true);
      } else {
        setIsSubmitted(false);
      }
    }
  }, [activeGuest, config.mealOptions]);

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) {
      setSearchError('Please enter your full name or invitation code.');
      return;
    }

    const guest = searchGuest(searchQuery);
    if (guest) {
      setActiveGuest(guest);
      setIsRegisterMode(false);
      setIsSubmitted(guest.rsvpStatus !== 'pending');
    } else {
      setSearchError(`We couldn't find an invitation matching "${searchQuery}". You can register directly or try searching with just your first or last name.`);
    }
  };

  const handleCompanionNameChange = (index: number, val: string) => {
    const next = [...companionNames];
    next[index] = val;
    setCompanionNames(next);
  };

  const toggleDietary = (item: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F86D93', '#D4AF37', '#FFCCD8', '#DB205B', '#FFFDFB']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F86D93', '#D4AF37', '#FFCCD8']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#F86D93', '#D4AF37', '#FFCCD8']
        });
      }, 250);
    } catch (e) {
      console.log('Confetti trigger', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (activeGuest && !isRegisterMode) {
        // Update existing guest
        submitRsvp(activeGuest.id, {
          name: fullName,
          email,
          phone,
          rsvpStatus,
          attendingCount: rsvpStatus === 'attending' ? attendingCount : 0,
          companionNames: rsvpStatus === 'attending' ? companionNames.slice(0, attendingCount - 1) : [],
          mealSelection: rsvpStatus === 'attending' ? mealSelection : undefined,
          dietaryRestrictions: rsvpStatus === 'attending' ? dietaryRestrictions : [],
          dietaryDetails: rsvpStatus === 'attending' ? dietaryDetails : undefined,
          songRequest: rsvpStatus === 'attending' ? songRequest : undefined,
          message
        });
      } else {
        // Register new guest
        const newG = registerAndRsvp({
          name: fullName,
          email,
          phone,
          rsvpStatus,
          partySize: maxPartySize,
          attendingCount: rsvpStatus === 'attending' ? attendingCount : 0,
          companionNames: rsvpStatus === 'attending' ? companionNames.slice(0, attendingCount - 1) : [],
          mealSelection: rsvpStatus === 'attending' ? mealSelection : undefined,
          dietaryRestrictions: rsvpStatus === 'attending' ? dietaryRestrictions : [],
          dietaryDetails: rsvpStatus === 'attending' ? dietaryDetails : undefined,
          songRequest: rsvpStatus === 'attending' ? songRequest : undefined,
          message
        });
        setActiveGuest(newG);
      }

      setIsSubmitting(false);
      setIsSubmitted(true);

      if (rsvpStatus === 'attending') {
        triggerConfetti();
      }
    }, 400);
  };

  return (
    <section id="rsvp" className="py-24 relative bg-gradient-to-b from-[#FFFDFB] via-[#FFF3F6] to-[#FFF9FB] overflow-hidden">
      {/* Decorative floral elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blush-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blush-200 shadow-sm text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Heart className="w-3.5 h-3.5 text-blush-500 fill-blush-500 animate-pulse" />
            <span>Celebrate With Us</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Wedding RSVP
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Kindly respond by May 1st, 2027. We can’t wait to celebrate our special day with you!
          </p>
        </div>

        {/* STEP 1: Search Invitation OR Direct Registration Banner */}
        {!activeGuest && !isRegisterMode && (
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-blush-200 shadow-xl max-w-2xl mx-auto mb-8 animate-fadeIn">
            <div className="text-center mb-6">
              <h3 className="font-serif text-2xl text-stone-800 mb-2">Find Your Invitation</h3>
              <p className="text-stone-500 text-xs sm:text-sm">
                Enter your full name or the unique invite code provided on your invitation card.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your name or invite code (e.g. Brumilda or CA-BRUMILDA)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-blush-200 focus:border-blush-500 focus:ring-2 focus:ring-blush-200 outline-none text-stone-800 placeholder:text-stone-400 text-sm shadow-sm transition"
                />
              </div>

              {searchError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-blush-500 via-rose-500 to-blush-600 text-white font-semibold uppercase tracking-wider text-xs shadow-md shadow-blush-500/25 hover:shadow-lg hover:shadow-blush-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search Invitation</span>
              </button>
            </form>

            {/* Quick Demo Helpers & Open Registration Button */}
            <div className="mt-8 pt-6 border-t border-blush-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-[11px] uppercase tracking-wider text-stone-400">Quick lookup:</span>
                <button
                  onClick={() => {
                    const g = searchGuest('Brumilda');
                    if (g) setActiveGuest(g);
                  }}
                  className="px-2.5 py-1 rounded-full bg-blush-50 hover:bg-blush-100 text-rosewood border border-blush-200 transition font-medium text-[11px]"
                >
                  Brumilda
                </button>
                <button
                  onClick={() => {
                    const g = searchGuest('Roy');
                    if (g) setActiveGuest(g);
                  }}
                  className="px-2.5 py-1 rounded-full bg-blush-50 hover:bg-blush-100 text-rosewood border border-blush-200 transition font-medium text-[11px]"
                >
                  Roy
                </button>
                <button
                  onClick={() => {
                    const g = searchGuest('Janke');
                    if (g) setActiveGuest(g);
                  }}
                  className="px-2.5 py-1 rounded-full bg-blush-50 hover:bg-blush-100 text-rosewood border border-blush-200 transition font-medium text-[11px]"
                >
                  Janke
                </button>
                <button
                  onClick={() => {
                    const g = searchGuest('Ethan');
                    if (g) setActiveGuest(g);
                  }}
                  className="px-2.5 py-1 rounded-full bg-blush-50 hover:bg-blush-100 text-rosewood border border-blush-200 transition font-medium text-[11px]"
                >
                  Ethan
                </button>
              </div>

              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setFullName('');
                  setMaxPartySize(2);
                }}
                className="text-blush-600 hover:text-blush-800 font-medium flex items-center gap-1 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Not listed? Register directly &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Active Guest Found OR Direct Register Form */}
        {(activeGuest || isRegisterMode) && !isSubmitted && (
          <div className="glass-card rounded-3xl p-6 sm:p-10 border border-blush-200 shadow-2xl max-w-2xl mx-auto animate-fadeIn">
            {/* Top Bar with Back/Switch guest button */}
            <div className="flex items-center justify-between pb-6 border-b border-blush-100 mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-blush-600 font-semibold block">
                  {isRegisterMode ? 'New Guest Registration' : 'Personal Invitation'}
                </span>
                <h3 className="font-serif text-2xl text-stone-800">
                  {activeGuest ? activeGuest.name : 'Welcome, Honored Guest'}
                </h3>
                {activeGuest?.inviteCode && (
                  <span className="text-xs font-mono text-stone-400">
                    Code: {activeGuest.inviteCode}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setActiveGuest(null);
                  setIsRegisterMode(false);
                }}
                className="text-xs text-stone-400 hover:text-stone-700 underline"
              >
                Change Guest
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* If registering manually, ask for Name */}
              {isRegisterMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-blush-200 focus:border-blush-500 focus:ring-2 focus:ring-blush-200 outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Attendance Choice */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3 text-center sm:text-left">
                  Will You Be Attending? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('attending')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                      rsvpStatus === 'attending'
                        ? 'border-blush-500 bg-blush-50/80 shadow-md shadow-blush-500/10'
                        : 'border-stone-200 bg-white hover:border-blush-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      rsvpStatus === 'attending' ? 'bg-blush-500 text-white' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif font-semibold text-stone-800 text-base">Joyfully Accept</div>
                      <div className="text-xs text-stone-500 mt-0.5">I will attend with pleasure!</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRsvpStatus('declined')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                      rsvpStatus === 'declined'
                        ? 'border-stone-400 bg-stone-50 shadow-md'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      rsvpStatus === 'declined' ? 'bg-stone-600 text-white' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif font-semibold text-stone-800 text-base">Regretfully Decline</div>
                      <div className="text-xs text-stone-500 mt-0.5">Will celebrate from afar.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional fields if ATTENDING */}
              {rsvpStatus === 'attending' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Party Size / Number Attending */}
                  <div className="p-5 rounded-2xl bg-blush-50/50 border border-blush-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blush-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                          Number of Guests Attending
                        </span>
                      </div>
                      <span className="text-xs text-rosewood font-medium">
                        Max {maxPartySize} {maxPartySize > 1 ? 'Guests' : 'Guest'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {Array.from({ length: maxPartySize }, (_, i) => i + 1).map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setAttendingCount(num);
                            if (num > 1 && companionNames.length < num - 1) {
                              setCompanionNames(Array(num - 1).fill(''));
                            }
                          }}
                          className={`w-12 h-12 rounded-xl font-serif text-lg font-semibold transition-all ${
                            attendingCount === num
                              ? 'bg-blush-500 text-white shadow-md shadow-blush-500/25 scale-105'
                              : 'bg-white text-stone-700 border border-blush-200 hover:bg-blush-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    {/* Plus One / Companion Names */}
                    {attendingCount > 1 && (
                      <div className="mt-4 pt-4 border-t border-blush-200/60 space-y-3">
                        <span className="text-xs text-stone-600 font-medium block">
                          Please provide the name(s) of your accompanying guest(s):
                        </span>
                        {Array.from({ length: attendingCount - 1 }).map((_, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Guest #${idx + 2} Full Name`}
                            value={companionNames[idx] || ''}
                            onChange={e => handleCompanionNameChange(idx, e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meal Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="w-4 h-4 text-blush-600" />
                      <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                        Entrée / Meal Preference *
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.mealOptions.map(meal => (
                        <div
                          key={meal.id}
                          onClick={() => setMealSelection(meal.name)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            mealSelection === meal.name
                              ? 'border-blush-500 bg-blush-50/80 shadow-md shadow-blush-500/10 ring-2 ring-blush-200'
                              : 'border-blush-100 bg-white hover:border-blush-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xl">{meal.icon}</span>
                            <span className="text-[10px] text-blush-700 bg-blush-100/70 px-2 py-0.5 rounded-full font-medium">
                              {meal.tags[0]}
                            </span>
                          </div>
                          <h4 className="font-serif font-semibold text-stone-800 text-sm mb-1">{meal.name}</h4>
                          <p className="text-stone-500 text-[11px] leading-relaxed line-clamp-2">{meal.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Restrictions & Allergies */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
                      Dietary Requirements &amp; Allergies
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy', 'Halal', 'Kosher'].map(diet => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => toggleDietary(diet)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            dietaryRestrictions.includes(diet)
                              ? 'bg-rosewood text-white shadow-sm font-medium'
                              : 'bg-white text-stone-600 border border-blush-200 hover:bg-blush-50'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Additional dietary or allergy notes for the chef..."
                      value={dietaryDetails}
                      onChange={e => setDietaryDetails(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none placeholder:text-stone-400"
                    />
                  </div>

                  {/* Song Request */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Music className="w-4 h-4 text-blush-600" />
                      <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                        DJ Song Request
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Song Title & Artist (What will get you on the dance floor?)"
                      value={songRequest}
                      onChange={e => setSongRequest(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-blush-200 text-sm focus:ring-2 focus:ring-blush-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Message to Couple */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquareHeart className="w-4 h-4 text-blush-600" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    A Note or Blessing for Sophia &amp; Alexander
                  </label>
                </div>
                <textarea
                  rows={3}
                  placeholder="Share a warm blessing, memory, or congratulatory note (will be displayed on the Wishes guestbook!)..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-blush-200 text-sm focus:ring-2 focus:ring-blush-200 outline-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">
                    Email Address (For Schedule Updates)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-blush-500 via-rose-500 to-blush-600 text-white font-semibold uppercase tracking-widest text-xs shadow-lg shadow-blush-500/30 hover:shadow-blush-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting RSVP...</span>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Confirm RSVP Response</span>
                    <Sparkles className="w-4 h-4 text-gold-light" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Confirmation Voucher Card */}
        {isSubmitted && activeGuest && (
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-blush-200 shadow-2xl max-w-2xl mx-auto text-center animate-fadeIn relative overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-blush-200/40 rounded-full blur-2xl pointer-events-none"></div>

            {/* Checkmark badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blush-500/30">
              {activeGuest.rsvpStatus === 'attending' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Heart className="w-8 h-8 fill-white" />
              )}
            </div>

            <span className="text-xs uppercase tracking-[0.25em] text-blush-600 font-semibold block mb-1">
              RSVP Recorded With Thanks
            </span>

            <h3 className="font-serif text-3xl sm:text-4xl text-stone-800 mb-3">
              {activeGuest.rsvpStatus === 'attending'
                ? `We Can't Wait to Celebrate, ${activeGuest.name.split(' ')[0]}!`
                : `Thank You, ${activeGuest.name.split(' ')[0]}`}
            </h3>

            <p className="text-stone-600 text-sm max-w-md mx-auto mb-8 font-display italic">
              {activeGuest.rsvpStatus === 'attending'
                ? `Your response has been confirmed for ${activeGuest.attendingCount} guest${activeGuest.attendingCount > 1 ? 's' : ''}. We look forward to celebrating with you at ${config.ceremonyVenue.name}, ${config.ceremonyVenue.city} on ${new Date(config.weddingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}!`
                : `We received your response and are so grateful for your warm thoughts and blessings.`}
            </p>

            {/* Summary Pass Card */}
            <div className="bg-white/95 rounded-2xl p-6 border border-blush-200 shadow-sm text-left max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-medium">Guest Pass</span>
                  <div className="font-serif font-semibold text-stone-800 text-base">{activeGuest.name}</div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeGuest.rsvpStatus.toUpperCase()}</span>
                </div>
              </div>

              {activeGuest.rsvpStatus === 'attending' && (
                <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 mb-3">
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Guests Attending</span>
                    <span className="font-medium text-stone-800">{activeGuest.attendingCount} person(s)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-400 block">Meal Choice</span>
                    <span className="font-medium text-stone-800 truncate block">{activeGuest.mealSelection || 'Standard'}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                <span>Pass Code: {activeGuest.inviteCode}</span>
                <span className="flex items-center gap-1 text-blush-600">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Verified Pass</span>
                </span>
              </div>
            </div>

            {/* Action Buttons: Add to Calendar, Print Invitation & Edit */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-4">
              {activeGuest.rsvpStatus === 'attending' && (
                <>
                  <button
                    onClick={() => generateIcsFile(config)}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-blush-500 hover:bg-blush-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .ICS</span>
                  </button>

                  <a
                    href={getGoogleCalendarUrl(config)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-blush-200 text-xs font-medium uppercase tracking-wider transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Google Calendar</span>
                  </a>
                </>
              )}
            </div>

            {/* Cute Print Keepsake Button */}
            <div className="flex justify-center mb-6">
              <CutePrintButton guestName={activeGuest.name} />
            </div>

            {/* Edit RSVP Button */}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-stone-500 hover:text-blush-600 font-medium inline-flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Need to change or update your RSVP? Click here</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
