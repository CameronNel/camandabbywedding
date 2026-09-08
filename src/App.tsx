import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { WeddingProvider } from './context/WeddingContext';
import { Navbar, type SectionId } from './components/Navbar';
import { Hero } from './components/Hero';
import { RsvpSection } from './components/RsvpSection';
import { VenueTravel } from './components/VenueTravel';
import { PhotoGallery } from './components/PhotoGallery';
import { Registry } from './components/Registry';
import { BachelorParty } from './components/BachelorParty';
import { BacheloretteParty } from './components/BacheloretteParty';
import { Footer } from './components/Footer';
import { useGuestExperience } from './components/guestExperience';
import { SakuraPetals } from './components/decorations/SakuraPetals';
import { TulipDivider, PastelTulip } from './components/decorations/TulipAccents';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })),
);

const sectionIds: SectionId[] = ['home', 'rsvp', 'details', 'gallery', 'gifts', 'bachelor', 'bachelorette'];

function isSectionId(value: string): value is SectionId {
  return sectionIds.includes(value as SectionId);
}

export function AppContent() {
  const { adminOpen } = useGuestExperience();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const initial = window.location.hash.slice(1).toLowerCase();
    return isSectionId(initial) ? initial : 'home';
  });
  const isNavigatingRef = useRef(false);

  const navigate = useCallback((section: SectionId, behavior: ScrollBehavior = 'smooth') => {
    isNavigatingRef.current = true;
    setActiveSection(section);

    if (section === 'home' || section === 'bachelor' || section === 'bachelorette') {
      window.scrollTo({ top: 0, behavior });
    } else {
      const target = document.getElementById(section);
      if (!target) {
        window.scrollTo({ top: 0, behavior });
      } else {
        const nav = document.querySelector('.site-nav') as HTMLElement | null;
        const navHeight = nav ? nav.offsetHeight : 76;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - navHeight;
        window.scrollTo({
          top: Math.max(0, Math.round(offsetPosition)),
          behavior,
        });
      }
    }
    const nextUrl = `${window.location.pathname}${window.location.search}#${section}`;
    window.history.replaceState(null, '', nextUrl);

    const onScrollDone = () => {
      isNavigatingRef.current = false;
      window.removeEventListener('scrollend', onScrollDone);
    };
    window.addEventListener('scrollend', onScrollDone, { once: true });
    window.setTimeout(() => {
      isNavigatingRef.current = false;
    }, behavior === 'smooth' ? 850 : 80);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1).toLowerCase();
    if (!isSectionId(hash) || hash === 'home') return;
    const timer = window.setTimeout(() => navigate(hash, 'auto'), 80);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  const isPartyView = activeSection === 'bachelor' || activeSection === 'bachelorette';

  useEffect(() => {
    if (isPartyView) return;

    const mainSections: SectionId[] = ['home', 'rsvp', 'details', 'gallery', 'gifts'];
    let ticking = false;

    const updateActiveSectionOnScroll = () => {
      if (isNavigatingRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 1. If near top of page, always home
      if (scrollY < 120) {
        setActiveSection(prev => (prev !== 'home' ? 'home' : prev));
        return;
      }

      // 2. If reached bottom of page, always gifts
      if (scrollY + windowHeight >= docHeight - 70) {
        setActiveSection(prev => (prev !== 'gifts' ? 'gifts' : prev));
        return;
      }

      // 3. Find the section currently in view based on the top edge threshold
      const nav = document.querySelector('.site-nav') as HTMLElement | null;
      const navHeight = nav ? nav.offsetHeight : 76;
      const triggerPoint = navHeight + Math.min(240, windowHeight * 0.32);

      let current: SectionId = 'home';
      for (const id of mainSections) {
        const element = document.getElementById(id);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top <= triggerPoint) {
          current = id;
        }
      }

      setActiveSection(prev => {
        if (prev !== current) {
          const nextUrl = `${window.location.pathname}${window.location.search}#${current}`;
          window.history.replaceState(null, '', nextUrl);
          return current;
        }
        return prev;
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateActiveSectionOnScroll();
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isPartyView]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#faf3f5] text-stone-800">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {/* Luminous Ambient Light Auras in Official Brand Colors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Dusty Rose (#E4AEB5) & Soft Peach (#F5D0C6) Top Glow */}
        <div className="absolute -top-24 -left-20 h-[620px] w-[620px] rounded-full bg-[#E4AEB5]/45 blur-[120px]" />
        <div className="absolute top-[14%] -right-32 h-[660px] w-[660px] rounded-full bg-[#F5D0C6]/42 blur-[130px]" />
        {/* Eucalyptus Sage (#9BBEAB) & Seafoam Mint (#C0DCCC) Middle Glow */}
        <div className="absolute top-[36%] -left-28 h-[650px] w-[650px] rounded-full bg-[#9BBEAB]/42 blur-[125px]" />
        <div className="absolute top-[50%] -right-24 h-[670px] w-[670px] rounded-full bg-[#C0DCCC]/40 blur-[125px]" />
        {/* Warm Linen (#ECE3DF) & Dusty Terracotta (#E7AF9E) Lower Glow */}
        <div className="absolute top-[68%] -left-24 h-[670px] w-[670px] rounded-full bg-[#ECE3DF]/50 blur-[130px]" />
        <div className="absolute top-[80%] -right-20 h-[700px] w-[700px] rounded-full bg-[#E7AF9E]/38 blur-[135px]" />
        <div className="absolute -bottom-20 left-1/3 h-[620px] w-[620px] rounded-full bg-[#9BBEAB]/45 blur-[130px]" />
      </div>

      <SakuraPetals />
      <Navbar activeSection={activeSection} onNavigate={navigate} />
      <main id="main-content" className="relative z-10">
        {activeSection === 'bachelor' ? (
          <BachelorParty onNavigate={navigate} />
        ) : activeSection === 'bachelorette' ? (
          <BacheloretteParty onNavigate={navigate} />
        ) : (
          <>
            {/* Floating subtle pastel tulips on wide screens along gutters */}
            <aside aria-hidden="true" className="pointer-events-auto fixed left-4 top-1/3 z-20 hidden 2xl:block opacity-80 hover:opacity-100 transition-opacity">
              <PastelTulip color="pink" size={38} tilt={-10} className="animate-gentle-sway drop-shadow-sm" />
            </aside>
            <aside aria-hidden="true" className="pointer-events-auto fixed right-4 top-2/3 z-20 hidden 2xl:block opacity-80 hover:opacity-100 transition-opacity">
              <PastelTulip color="sage" size={36} tilt={12} className="animate-gentle-sway-delayed drop-shadow-sm" />
            </aside>

            <Hero onNavigate={navigate} />
            <TulipDivider className="py-4" />
            <RsvpSection onNavigate={navigate} />
            <TulipDivider className="py-4" />
            <VenueTravel onNavigate={navigate} />
            <TulipDivider className="py-4" />
            <PhotoGallery />
            <TulipDivider className="py-4" />
            <Registry onNavigate={navigate} />
          </>
        )}
      </main>
      <Footer onNavigate={navigate} />
      {adminOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[90] grid place-items-center bg-stone-950/60 text-sm font-semibold text-white backdrop-blur-sm">Opening organizer portal…</div>}>
          <AdminDashboard />
        </Suspense>
      )}
    </div>
  );
}

export function App() {
  return (
    <WeddingProvider>
      <AppContent />
    </WeddingProvider>
  );
}

export default App;
