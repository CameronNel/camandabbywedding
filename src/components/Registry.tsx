import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Gift, Heart, KeyRound, LockKeyhole } from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { useGuestExperience } from './guestExperience';

interface RegistryProps {
  onNavigate: (section: SectionId) => void;
}

export function Registry({ onNavigate }: RegistryProps) {
  const { activeHousehold, registryItems, site } = useGuestExperience();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyDetails = async (id: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section id="gifts" className="anchor-section relative overflow-hidden bg-[#efe8df] px-5 pt-8 pb-20 sm:px-8 sm:pt-10 sm:pb-28">
      <div className="absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full border border-[#bca995]/30" aria-hidden="true" />
      <div className="absolute -bottom-64 -left-56 h-[40rem] w-[40rem] rounded-full border border-[#bca995]/25" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">With love</p>
          <h2 className="section-title">Gifts</h2>
          <p className="section-copy mt-5">Sharing the day with the people we love matters most. Gift details, where applicable, are private to each invitation.</p>
        </Reveal>

        {!activeHousehold ? (
          <Reveal delay={80} className="mt-8 grid overflow-hidden rounded-[2rem] border border-[#d4c7b8] bg-[#f8f5ef] shadow-[0_24px_70px_rgba(82,61,48,0.1)] sm:mt-10 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="grid h-full min-h-36 place-items-center bg-[#704b3d] px-9 text-[#f3e9df]">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <div className="p-7 sm:p-9">
              <h3 className="font-display text-3xl text-stone-800">Open your private invitation first</h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-stone-600">Once your invitation is verified, this page will show the message or gift details chosen for your household.</p>
            </div>
            <div className="px-7 pb-7 md:pr-9 md:pt-7">
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary min-h-11 whitespace-nowrap px-6"><KeyRound className="h-4 w-4" /> Open invitation</button>
            </div>
          </Reveal>
        ) : activeHousehold.presenceIsOurGift ? (
          <Reveal delay={80} className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-[#aeb9a4] bg-[#eef1e9] p-8 text-center shadow-[0_24px_70px_rgba(72,81,67,0.12)] sm:p-14">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#596651] text-white">
              <Heart className="h-7 w-7 fill-current" />
            </span>
            <p className="eyebrow mt-7 text-[#596651]">A note just for you</p>
            <h3 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-tight text-stone-800 sm:text-5xl">Your presence is the only present we want.</h3>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-600">
              You have been kindly blocked from giving gifts, as having you there to celebrate with us is the greatest gift in and of itself! Please bring only yourselves and your smiles.
            </p>
            <p className="mt-6 font-script text-3xl text-[#704b3d]">With all our love, {site.groomName} &amp; {site.brideName}</p>
          </Reveal>
        ) : registryItems.length ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {registryItems.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index, 3) * 60}>
                <article className="flex h-full flex-col rounded-[1.5rem] border border-[#d4c7b8] bg-[#fdfbf7] p-7 shadow-[0_16px_50px_rgba(82,61,48,0.07)]">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f0e5da] text-[#704b3d]"><Gift className="h-5 w-5" /></span>
                  <h3 className="mt-6 font-display text-2xl font-semibold text-stone-800">{item.title}</h3>
                  {item.description && <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>}
                  <div className="mt-auto pt-6">
                    {item.accountDetails && (
                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <p className="break-words font-mono text-[11px] leading-5 text-stone-600">{item.accountDetails}</p>
                        <button type="button" onClick={() => void copyDetails(item.id, item.accountDetails)} className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#704b3d]">
                          {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === item.id ? 'Copied' : 'Copy details'}
                        </button>
                      </div>
                    )}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#704b3d] underline decoration-[#c7aa98] underline-offset-4">View gift option <ArrowUpRight className="h-4 w-4" /></a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal delay={80} className="mt-12 rounded-[2rem] border border-dashed border-[#c8b8a8] bg-[#f8f5ef]/80 p-10 text-center">
            <Gift className="mx-auto h-7 w-7 text-[#84614e]" />
            <h3 className="mt-4 font-display text-3xl text-stone-800">No gift options have been published.</h3>
            <p className="mt-2 text-sm text-stone-600">If {site.groomName} and {site.brideName} add anything for your household, it will appear here.</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
