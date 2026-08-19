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
    const target = document.getElementById(section);
    if (!target) return;
    target.scrollIntoView({ behavior, block: 'start' });
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
    <div className="min-h-screen overflow-x-clip bg-[#f8f5ef] text-stone-800">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar activeSection={activeSection} onNavigate={navigate} />
      <main id="main-content">
        <Hero onNavigate={navigate} />
        <RsvpSection onNavigate={navigate} />
        <VenueTravel onNavigate={navigate} />
        <PhotoGallery />
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
