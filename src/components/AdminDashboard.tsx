import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BedDouble,
  CalendarHeart,
  Camera,
  Eye,
  EyeOff,
  Gift,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import type { GalleryItem, HouseholdInvitation } from '../types/wedding';
import type { InvitationVariant } from '../utils/invitations';
import { PrintInvitationModal } from './PrintInvitationModal';
import { AdminOverview, type AdminSection } from './admin/AdminOverview';
import { Button, Toast, inputClass } from './admin/AdminPrimitives';
import { ContentManager } from './admin/ContentManager';
import { DeliveryManager } from './admin/DeliveryManager';
import { GalleryManager } from './admin/GalleryManager';
import { HouseholdManager } from './admin/HouseholdManager';
import { SiteSettings } from './admin/SiteSettings';
import type { ProviderStatus, ToastState } from './admin/contracts';

const navigation: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'households', label: 'Households', icon: <Users className="h-4 w-4" /> },
  { id: 'invitations', label: 'Invitations', icon: <CalendarHeart className="h-4 w-4" /> },
  { id: 'content', label: 'Stay, services & gifts', icon: <BedDouble className="h-4 w-4" /> },
  { id: 'gallery', label: 'Gallery', icon: <Camera className="h-4 w-4" /> },
  { id: 'settings', label: 'Site settings', icon: <Settings2 className="h-4 w-4" /> },
];

const fileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error || new Error('The image could not be read.'));
  reader.readAsDataURL(file);
});

export const AdminDashboard: React.FC = () => {
  const wedding = useWedding();
  const setIsAdminOpen = wedding.setIsAdminOpen;
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [preview, setPreview] = useState<{ household: HouseholdInvitation; variant: InvitationVariant } | null>(null);

  useEffect(() => {
    if (!wedding.isAdminOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preview) setIsAdminOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [preview, setIsAdminOpen, wedding.isAdminOpen]);

  const validIds = useMemo(() => new Set(wedding.households.map(household => household.id)), [wedding.households]);
  const activeSelectedIds = useMemo(() => new Set([...selectedIds].filter(id => validIds.has(id))), [selectedIds, validIds]);

  if (!wedding.isAdminOpen) return null;

  const notify = (next: ToastState) => {
    setToast(next);
    window.setTimeout(() => setToast(current => current === next ? null : current), 4500);
  };

  const navigate = (next: AdminSection) => {
    setSection(next);
    setMobileMenuOpen(false);
  };

  const providerStatus = (wedding as unknown as { providerStatus?: ProviderStatus }).providerStatus;

  const handleLocalGalleryUpload = async (file: File, metadata: Partial<GalleryItem>) => {
    if (wedding.dataMode === 'supabase') {
      await wedding.uploadGalleryPhoto(file, {
        title: metadata.title || file.name,
        altText: metadata.altText || metadata.title || file.name,
        ...metadata,
      });
      return;
    }
    if (file.size > 1_500_000) {
      throw new Error('Local preview storage is limited to 1.5 MB per photo. Configure Supabase Storage for full-size uploads.');
    }
    const src = await fileAsDataUrl(file);
    await wedding.addGalleryItem({
      storagePath: `local-preview/${file.name}`,
      src,
      category: metadata.category || 'couple',
      title: metadata.title || file.name,
      subtitle: metadata.subtitle,
      altText: metadata.altText || metadata.title || file.name,
      published: metadata.published ?? false,
      sortOrder: metadata.sortOrder ?? wedding.galleryItems.length,
    });
  };

  const dashboard = (
    <div className="fixed inset-0 z-[100000] overflow-hidden bg-stone-950/75 p-0 backdrop-blur-md sm:p-3" role="dialog" aria-modal="true" aria-label="Couple dashboard">
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-[#f7f5f2] shadow-2xl sm:h-[calc(100vh-1.5rem)] sm:rounded-[2rem] sm:border sm:border-white/30">
        {!wedding.isAdminAuthenticated ? (
          <AdminLogin
            dataMode={wedding.dataMode}
            isLoading={wedding.isLoading}
            onClose={() => wedding.setIsAdminOpen(false)}
            onPassword={wedding.signInAdmin}
            onMagicLink={wedding.sendAdminMagicLink}
            onPin={wedding.authenticateAdmin}
          />
        ) : (
          <>
            <header className="z-30 flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setMobileMenuOpen(open => !open)} className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 lg:hidden" aria-label="Toggle dashboard menu"><Menu className="h-5 w-5" /></button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#742039] to-[#ce6b87] text-white shadow-md"><Sparkles className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-semibold text-stone-900 sm:text-lg">{wedding.config.groomShortName} &amp; {wedding.config.brideShortName} · Couple Dashboard</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">
                    <span className={`rounded-full px-2 py-0.5 ${wedding.dataMode === 'supabase' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{wedding.dataMode === 'supabase' ? 'Shared cloud data' : 'Local preview data'}</span>
                    {wedding.adminSession?.email && wedding.adminSession.email !== 'local-fallback' && <span className="hidden truncate sm:inline">{wedding.adminSession.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void wedding.refreshData()} disabled={wedding.isLoading} className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 disabled:opacity-40" title="Refresh shared data"><RefreshCw className={`h-4 w-4 ${wedding.isLoading ? 'animate-spin' : ''}`} /></button>
                <button type="button" onClick={() => void wedding.logoutAdmin()} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 sm:flex"><LogOut className="h-3.5 w-3.5" /> Log out</button>
                <button type="button" onClick={() => wedding.setIsAdminOpen(false)} className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100" aria-label="Close dashboard"><X className="h-5 w-5" /></button>
              </div>
            </header>

            {wedding.dataMode === 'local' && (
              <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[10px] leading-relaxed text-amber-800">
                Local preview mode: edits persist in this browser only. Connect Supabase before collecting real guest contact details or sending invitations.
              </div>
            )}
            {wedding.dataError && (
              <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-[10px] font-medium text-rose-800">{wedding.dataError}</div>
            )}

            {mobileMenuOpen && (
              <nav className="z-20 grid shrink-0 grid-cols-2 gap-1 border-b border-stone-200 bg-white p-3 sm:grid-cols-3 lg:hidden">
                {navigation.map(item => <NavButton key={item.id} item={item} active={section === item.id} onClick={() => navigate(item.id)} />)}
                <button type="button" onClick={() => void wedding.logoutAdmin()} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Log out</button>
              </nav>
            )}

            <div className="flex min-h-0 flex-1">
              <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-4 lg:flex">
                <nav className="space-y-1">
                  {navigation.map(item => <NavButton key={item.id} item={item} active={section === item.id} onClick={() => navigate(item.id)} />)}
                </nav>
                <div className="mt-auto rounded-2xl border border-[#e1c5ce] bg-[#fff7f9] p-4 text-[10px] leading-relaxed text-[#713047]">
                  <ShieldCheck className="mb-2 h-4 w-4" />
                  <strong className="block text-xs">Private by design</strong>
                  Household invite codes are bearer secrets. Only copy a personalised link to its intended recipients.
                </div>
              </aside>

              <main className="min-w-0 flex-1 overflow-y-auto">
                {wedding.isLoading && wedding.dataMode === 'supabase' ? (
                  <div className="flex min-h-[50vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#8a2947]" /><p className="mt-3 text-xs text-stone-500">Loading shared wedding data…</p></div></div>
                ) : (
                  <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                    {section === 'overview' && <AdminOverview config={wedding.config} households={wedding.households} accommodations={wedding.accommodations} services={wedding.services} gallery={wedding.galleryItems} registry={wedding.registryItems} deliveries={wedding.invitationDeliveries} onNavigate={navigate} />}
                    {section === 'households' && <HouseholdManager config={wedding.config} households={wedding.households} selectedIds={activeSelectedIds} onSelectionChange={setSelectedIds} onCreate={async draft => { await wedding.createHousehold(draft); }} onUpdate={wedding.updateHousehold} onDelete={wedding.deleteHousehold} onPreview={(household, variant) => setPreview({ household, variant })} notify={notify} />}
                    {section === 'invitations' && <DeliveryManager config={wedding.config} dataMode={wedding.dataMode} households={wedding.households} selectedIds={activeSelectedIds} onSelectionChange={setSelectedIds} templates={wedding.invitationTemplates} deliveries={wedding.invitationDeliveries} providerStatus={providerStatus} onUpsertTemplate={wedding.upsertInvitationTemplate} onSend={wedding.sendInvitations} onPreview={(household, variant) => setPreview({ household, variant })} notify={notify} />}
                    {section === 'content' && <ContentManager accommodations={wedding.accommodations} services={wedding.services} registryItems={wedding.registryItems} onAddAccommodation={async item => { await wedding.addAccommodation(item); }} onUpdateAccommodation={async (id, updates) => { await wedding.updateAccommodation(id, updates); }} onDeleteAccommodation={wedding.deleteAccommodation} onAddService={async item => { await wedding.addService(item); }} onUpdateService={wedding.updateService} onDeleteService={wedding.deleteService} onAddRegistry={async item => { await wedding.addRegistryItem(item); }} onUpdateRegistry={wedding.updateRegistryItem} onDeleteRegistry={wedding.deleteRegistryItem} notify={notify} />}
                    {section === 'gallery' && <GalleryManager items={wedding.galleryItems} onUpload={handleLocalGalleryUpload} onUpdate={wedding.updateGalleryItem} onDelete={wedding.deleteGalleryItem} notify={notify} />}
                    {section === 'settings' && <SiteSettings config={wedding.siteConfig} onSave={wedding.updateSiteConfig} notify={notify} />}
                  </div>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {preview && (
        <PrintInvitationModal
          isOpen
          onClose={() => setPreview(null)}
          household={preview.household}
          invitationType={preview.variant}
        />
      )}
    </div>
  );

  return createPortal(dashboard, document.body);
};

const NavButton: React.FC<{
  item: { id: AdminSection; label: string; icon: React.ReactNode };
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold transition ${active ? 'bg-[#7f2540] text-white shadow-sm' : 'text-stone-600 hover:bg-[#fff5f8] hover:text-[#7f2540]'}`}>{item.icon}<span className="truncate">{item.label}</span></button>
);

const AdminLogin: React.FC<{
  dataMode: 'supabase' | 'local';
  isLoading: boolean;
  onClose: () => void;
  onPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onPin: (pin: string) => boolean;
}> = ({ dataMode, isLoading, onClose, onPassword, onMagicLink, onPin }) => {
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (dataMode === 'local') {
        if (!onPin(pin)) setMessage({ tone: 'error', text: 'That local preview PIN is not correct.' });
        return;
      }
      const result = authMode === 'password' ? await onPassword(email.trim(), password) : await onMagicLink(email.trim());
      if (!result.ok) setMessage({ tone: 'error', text: result.error || 'Sign-in failed. Please try again.' });
      else if (authMode === 'magic') setMessage({ tone: 'success', text: 'Magic link sent. Open it in this browser to continue.' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Sign-in failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-gradient-to-br from-[#f8eef1] via-[#fbfaf8] to-[#eef2eb] p-4">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/75 p-2 text-stone-500 shadow-sm backdrop-blur hover:bg-white" aria-label="Close admin login"><X className="h-5 w-5" /></button>
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl md:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[#6f2138] p-8 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#dc8098]/25 blur-2xl" /><div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#d8bf83]/20 blur-2xl" />
          <div className="relative"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10"><LockKeyhole className="h-5 w-5" /></div><h1 className="mt-6 font-serif text-3xl font-semibold">Everything important, in one private place.</h1><p className="mt-3 text-sm leading-relaxed text-white/70">Manage guests, access rules, invitations, photos and confirmed site details together.</p></div>
          <div className="relative space-y-3 text-xs text-white/75"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#e8c98e]" /> Approved couple accounts only</p><p className="flex items-center gap-2"><Users className="h-4 w-4 text-[#e8c98e]" /> Private household bearer links</p><p className="flex items-center gap-2"><Gift className="h-4 w-4 text-[#e8c98e]" /> Tag-aware housing and gifts</p></div>
        </div>
        <div className="p-6 sm:p-10">
          <div className="mb-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5e4e9] text-[#7f2540] md:hidden"><LockKeyhole className="h-5 w-5" /></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a45d72] md:mt-0">Couple dashboard</p><h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900">Welcome back</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">{dataMode === 'supabase' ? 'Sign in with one of the two approved admin accounts.' : 'Supabase is not configured. Use the local preview PIN for this browser only.'}</p></div>

          {isLoading && dataMode === 'supabase' ? <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-4 text-xs text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking your existing session…</div> : (
            <form onSubmit={submit} className="space-y-4">
              {dataMode === 'supabase' ? (
                <>
                  <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1"><button type="button" onClick={() => setAuthMode('password')} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${authMode === 'password' ? 'bg-white text-[#7f2540] shadow-sm' : 'text-stone-500'}`}>Password</button><button type="button" onClick={() => setAuthMode('magic')} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${authMode === 'magic' ? 'bg-white text-[#7f2540] shadow-sm' : 'text-stone-500'}`}>Magic link</button></div>
                  <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-500">Admin email</span><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className={`${inputClass} pl-9`} /></div></label>
                  {authMode === 'password' && <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-500">Password</span><div className="relative"><input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className={`${inputClass} pr-10`} /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>}
                </>
              ) : (
                <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-500">Local preview PIN</span><input type="password" inputMode="numeric" maxLength={4} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••" className={`${inputClass} text-center font-mono text-2xl tracking-[0.45em]`} /></label>
              )}

              {message && <div className={`rounded-xl border p-3 text-xs ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message.text}</div>}
              <Button type="submit" tone="primary" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{dataMode === 'local' ? 'Open local dashboard' : authMode === 'magic' ? 'Send secure magic link' : 'Sign in securely'}</Button>
            </form>
          )}
          <p className="mt-5 text-center text-[10px] leading-relaxed text-stone-400">Guest contact details and invitation tokens should never be committed to the public GitHub repository.</p>
        </div>
      </div>
    </div>
  );
};
