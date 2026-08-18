import React, { useState, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';
import { CutePrintButton } from './PrintInvitationModal';
import { Menu, X, Lock, CalendarCheck, Sparkles, Home, Clock, BookOpen, Gift } from 'lucide-react';

export type TabId = 'home' | 'rsvp' | 'details' | 'story' | 'registry';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { config, setIsAdminOpen } = useWedding();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTabs: Array<{ id: TabId; name: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'rsvp', name: 'RSVP', icon: CalendarCheck },
    { id: 'details', name: 'Schedule & Venue', icon: Clock },
    { id: 'story', name: 'Our Story & Gallery', icon: BookOpen },
    { id: 'registry', name: 'Registry & Wishes', icon: Gift },
  ];

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState(null, '', `#${tab}`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-blush-100 py-3'
          : 'bg-white/80 backdrop-blur-sm border-b border-blush-100/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Monogram / Brand */}
        <button
          onClick={() => handleTabClick('home')}
          className="group flex items-center gap-2.5 text-left"
        >
          <div className="w-10 h-10 rounded-full border border-blush-300 flex items-center justify-center bg-blush-50 group-hover:border-blush-500 transition-colors shadow-inner">
            <span className="font-script text-2xl text-rosewood group-hover:scale-110 transition-transform">
              {config.brideShortName[0]} &amp; {config.groomShortName[0]}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-widest text-sm uppercase text-stone-800 font-semibold group-hover:text-blush-700 transition-colors">
              {config.brideShortName} &amp; {config.groomShortName}
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400">
              June 19, 2027
            </span>
          </div>
        </button>

        {/* Desktop Tab Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-blush-50/60 p-1.5 rounded-full border border-blush-200/80 shadow-inner">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blush-500 to-rose-500 text-white shadow-md shadow-blush-500/25 scale-[1.02]'
                    : 'text-stone-600 hover:text-blush-700 hover:bg-white/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
                {tab.id === 'rsvp' && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-blush-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTAs */}
        <div className="hidden sm:flex items-center gap-2.5">
          <CutePrintButton variant="outline" />

          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition border border-stone-200"
            title="Organizer / Admin Management"
          >
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Admin</span>
          </button>

          {activeTab !== 'rsvp' && (
            <button
              onClick={() => handleTabClick('rsvp')}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-blush-400 via-blush-500 to-rose-400 text-white shadow-md shadow-blush-500/20 hover:shadow-lg hover:shadow-blush-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>RSVP</span>
              <Sparkles className="w-3 h-3 text-gold-light" />
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {activeTab !== 'rsvp' && (
            <button
              onClick={() => handleTabClick('rsvp')}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-blush-500 text-white shadow-sm"
            >
              RSVP
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-blush-50 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-blush-100 px-6 py-6 shadow-2xl animate-fadeIn">
          <div className="flex flex-col space-y-3">
            {navTabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs uppercase tracking-widest font-medium transition ${
                    isActive
                      ? 'bg-blush-500 text-white shadow-md shadow-blush-500/20'
                      : 'text-stone-700 hover:bg-blush-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2.5">
              <CutePrintButton variant="outline" className="w-full justify-center py-2.5" />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAdminOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Couple &amp; Planner Dashboard (Admin)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
