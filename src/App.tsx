import { useState, useEffect } from 'react';
import { WeddingProvider } from './context/WeddingContext';
import { Navbar, type TabId } from './components/Navbar';
import { Hero } from './components/Hero';
import { Story } from './components/Story';
import { Schedule } from './components/Schedule';
import { VenueTravel } from './components/VenueTravel';
import { BridalParty } from './components/BridalParty';
import { PhotoGallery } from './components/PhotoGallery';
import { RsvpSection } from './components/RsvpSection';
import { Wishes } from './components/Wishes';
import { Registry } from './components/Registry';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { MusicPlayer } from './components/MusicPlayer';
import { PetalAnimation } from './components/PetalAnimation';
import { AdminDashboard } from './components/AdminDashboard';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'rsvp' || hash === 'details' || hash === 'story' || hash === 'registry') {
      return hash as TabId;
    }
    // If URL has ?code= or ?guest=, default directly to RSVP tab
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code') || urlParams.get('c') || urlParams.get('guest') || urlParams.get('g')) {
      return 'rsvp';
    }
    return 'home';
  });

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'home' || hash === 'rsvp' || hash === 'details' || hash === 'story' || hash === 'registry') {
        setActiveTab(hash as TabId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState(null, '', `#${tab}`);
  };

  return (
    <div className="relative min-h-screen bg-[#FFFDFB] text-stone-800 font-sans selection:bg-blush-200 selection:text-rosewood flex flex-col justify-between">
      {/* Floating Rose Petals Ambiance */}
      <PetalAnimation />

      {/* Ambient Romantic Music Synthesizer & Controller */}
      <MusicPlayer />

      {/* Main Tab Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Clean Tabbed Page Views (Zero Infinite Scrolling Clutter) */}
      <main className="flex-1">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            <Hero onNavigateTab={handleTabChange} />
          </div>
        )}

        {/* TAB 2: RSVP */}
        {activeTab === 'rsvp' && (
          <div className="pt-20 animate-fadeIn">
            <RsvpSection />
          </div>
        )}

        {/* TAB 3: SCHEDULE & VENUE DETAILS */}
        {activeTab === 'details' && (
          <div className="pt-20 animate-fadeIn">
            <Schedule />
            <VenueTravel />
            <FaqSection />
          </div>
        )}

        {/* TAB 4: OUR STORY & GALLERY */}
        {activeTab === 'story' && (
          <div className="pt-20 animate-fadeIn">
            <Story />
            <PhotoGallery />
            <BridalParty />
          </div>
        )}

        {/* TAB 5: REGISTRY & WISHES */}
        {activeTab === 'registry' && (
          <div className="pt-20 animate-fadeIn">
            <Registry />
            <Wishes />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Organizer / Admin Modal */}
      <AdminDashboard />
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
