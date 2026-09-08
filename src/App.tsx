import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { WeddingProvider } from './context/WeddingContext';
import { Navbar, type SectionId } from './components/Navbar';
import { Hero } from './components/Hero';
import { RsvpSection } from './components/RsvpSection';
import { VenueTravel } from './components/VenueTravel';
import { PhotoGallery } from './components/PhotoGallery';
import { Registry } from './components/Registry';
import { Footer } from './components/Footer';
import { useGuestExperience } from './components/guestExperience';
import { SakuraPetals } from './components/decorations/SakuraPetals';
import { TulipDivider, PastelTulip } from './components/decorations/TulipAccents';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })),
);

const sectionIds: SectionId[] = ['home', 'rsvp', 'details', 'gallery', 'gifts'];

function isSectionId(value: string): value is SectionId {
  return sectionIds.includes(value as SectionId);
}

export function AppContent() {
  const { adminOpen } = useGuestExperience();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const initial = window.location.hash.slice(1).toLowerCase();
    return isSectionId(initial) ? initial : 'home';
  });

  const navigate = useCallback((section: SectionId, behavior: ScrollBehavior = 'smooth') => {
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior });
    } else {
      const target = document.getElementById(section);
      if (!target) return;
      const nav = document.querySelector('.site-nav') as HTMLElement | null;
      const navHeight = nav ? nav.offsetHeight : 76;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navHeight;
      window.scrollTo({
        top: Math.max(0, Math.round(offsetPosition)),
        behavior,
      });
    }
    setActiveSection(section);
    const nextUrl = `${window.location.pathname}${window.location.search}#${section}`;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1).toLowerCase();
    if (!isSectionId(hash) || hash === 'home') return;
    const timer = window.setTimeout(() => navigate(hash, 'auto'), 80);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible && isSectionId(visible.target.id)) setActiveSection(visible.target.id);
      },
      { rootMargin: '-22% 0px -60% 0px', threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#fdfbfb] text-stone-800">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {/* Dreamy Pastel Ambient Light Auras in 7 Colors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Dusty Rose (#EDC9D4) & Soft Peach (#FFD3C9) Top Glow */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#EDC9D4]/25 blur-[120px]" />
        <div className="absolute top-[20%] -right-40 h-[560px] w-[560px] rounded-full bg-[#FFD3C9]/20 blur-[140px]" />
        {/* Buttercream (#FFF7CF) & Matcha Sage (#E4F0C9) Middle Glow */}
        <div className="absolute top-[45%] -left-36 h-[520px] w-[520px] rounded-full bg-[#FFF7CF]/25 blur-[130px]" />
        <div className="absolute top-[60%] -right-32 h-[540px] w-[540px] rounded-full bg-[#E4F0C9]/20 blur-[130px]" />
        {/* Sky Blue (#C7E0FF), Lilac (#CFCFFF) & Periwinkle (#BAC3FF) Lower Glow */}
        <div className="absolute top-[75%] -left-28 h-[550px] w-[550px] rounded-full bg-[#C7E0FF]/20 blur-[135px]" />
        <div className="absolute bottom-10 right-0 h-[580px] w-[580px] rounded-full bg-[#CFCFFF]/20 blur-[140px]" />
      </div>

      <SakuraPetals />
      <Navbar activeSection={activeSection} onNavigate={navigate} />
      <main id="main-content" className="relative z-10">
        {/* Floating subtle pastel tulips on wide screens along gutters */}
        <aside aria-hidden="true" className="pointer-events-auto fixed left-4 top-1/3 z-20 hidden 2xl:block opacity-80 hover:opacity-100 transition-opacity">
          <PastelTulip color="pink" size={38} tilt={-10} className="animate-gentle-sway drop-shadow-sm" />
        </aside>
        <aside aria-hidden="true" className="pointer-events-auto fixed right-4 top-2/3 z-20 hidden 2xl:block opacity-80 hover:opacity-100 transition-opacity">
          <PastelTulip color="lavender" size={36} tilt={12} className="animate-gentle-sway-delayed drop-shadow-sm" />
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
