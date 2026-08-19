import React from 'react';
import {
  AlertTriangle,
  BedDouble,
  CalendarHeart,
  Camera,
  CheckCircle2,
  Gift,
  MailCheck,
  Settings2,
  Users,
} from 'lucide-react';
import type {
  Accommodation,
  GalleryItem,
  HouseholdInvitation,
  InvitationDelivery,
  RegistryItem,
  WeddingConfig,
  WeddingService,
} from '../../types/wedding';
import { Button } from './AdminPrimitives';

export type AdminSection = 'overview' | 'households' | 'invitations' | 'content' | 'gallery' | 'settings';

interface AdminOverviewProps {
  config: WeddingConfig;
  households: HouseholdInvitation[];
  accommodations: Accommodation[];
  services: WeddingService[];
  gallery: GalleryItem[];
  registry: RegistryItem[];
  deliveries: InvitationDelivery[];
  onNavigate: (section: AdminSection) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  config,
  households,
  accommodations,
  services,
  gallery,
  registry,
  deliveries,
  onNavigate,
}) => {
  const attending = households.filter(household => household.rsvpStatus === 'attending');
  const pending = households.filter(household => household.rsvpStatus === 'pending');
  const invitees = households.reduce((total, household) => total + household.partySize, 0);
  const confirmedGuests = attending.reduce((total, household) => total + household.attendingCount, 0);
  const failed = deliveries.filter(delivery => delivery.status === 'failed' || delivery.status === 'bounced').length;
  const tbcCount = Object.values(config.tbcFields || {}).filter(Boolean).length;
  const publishableCount = accommodations.filter(item => item.published).length + services.filter(item => item.published).length + gallery.filter(item => item.published).length + registry.filter(item => item.published).length;

  const checks = [
    { done: households.length > 0, label: 'Guest households added', section: 'households' as AdminSection },
    { done: tbcCount === 0, label: 'Core wedding details confirmed', section: 'settings' as AdminSection },
    { done: gallery.some(item => item.published), label: 'Real gallery photo published', section: 'gallery' as AdminSection },
    { done: accommodations.some(item => item.published), label: 'Accommodation guidance published', section: 'content' as AdminSection },
    { done: deliveries.some(delivery => delivery.status === 'sent' || delivery.status === 'delivered'), label: 'First invitation batch sent', section: 'invitations' as AdminSection },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Couple command centre</p>
        <h2 className="font-serif text-2xl font-semibold text-stone-900">Wedding overview</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">A calm view of what is confirmed, what guests have done and what still needs attention.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users className="h-5 w-5" />} label="Guest list" value={`${households.length} households`} detail={`${invitees} invited · ${confirmedGuests} attending`} tone="rose" />
        <Metric icon={<CalendarHeart className="h-5 w-5" />} label="RSVP progress" value={`${pending.length} pending`} detail={`${attending.length} accepted · ${households.filter(item => item.rsvpStatus === 'declined').length} declined`} tone="sage" />
        <Metric icon={<MailCheck className="h-5 w-5" />} label="Delivery health" value={`${deliveries.length} attempts`} detail={failed ? `${failed} need attention` : 'No provider failures'} tone={failed ? 'amber' : 'blue'} />
        <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Published content" value={`${publishableCount} items`} detail={tbcCount ? `${tbcCount} detail sections still TBC` : 'Core details confirmed'} tone={tbcCount ? 'amber' : 'sage'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-lg font-semibold text-stone-900">Launch checklist</h3><p className="mt-0.5 text-[11px] text-stone-500">Nothing placeholder-shaped slips through.</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold text-stone-600">{checks.filter(item => item.done).length}/{checks.length} complete</span></div>
          <div className="mt-4 space-y-2">{checks.map(check => (
            <button key={check.label} type="button" onClick={() => onNavigate(check.section)} className="flex w-full items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-left transition hover:border-[#ddbdc7] hover:bg-[#fff8fa]">
              {check.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />}
              <span className={`flex-1 text-xs font-medium ${check.done ? 'text-stone-700' : 'text-stone-900'}`}>{check.label}</span>
              <span className="text-[10px] text-stone-400">Open →</span>
            </button>
          ))}</div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Quick actions</h3>
          <p className="mt-0.5 text-[11px] text-stone-500">Jump straight into the next useful task.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Button className="justify-start" onClick={() => onNavigate('households')}><Users className="h-4 w-4" /> Add or tag guests</Button>
            <Button className="justify-start" onClick={() => onNavigate('invitations')}><CalendarHeart className="h-4 w-4" /> Prepare invitation batch</Button>
            <Button className="justify-start" onClick={() => onNavigate('gallery')}><Camera className="h-4 w-4" /> Upload photos</Button>
            <Button className="justify-start" onClick={() => onNavigate('content')}><BedDouble className="h-4 w-4" /> Edit stay & services</Button>
            <Button className="justify-start" onClick={() => onNavigate('content')}><Gift className="h-4 w-4" /> Curate wishlist</Button>
            <Button className="justify-start" onClick={() => onNavigate('settings')}><Settings2 className="h-4 w-4" /> Confirm site facts</Button>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string; detail: string; tone: 'rose' | 'sage' | 'amber' | 'blue' }> = ({ icon, label, value, detail, tone }) => {
  const tones = {
    rose: 'bg-[#f7e7ec] text-[#8a2947]',
    sage: 'bg-[#e8efe5] text-[#557052]',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</div><p className="mt-4 text-[9px] font-bold uppercase tracking-[0.17em] text-stone-400">{label}</p><p className="mt-1 font-serif text-xl font-semibold text-stone-900">{value}</p><p className="mt-1 text-[10px] text-stone-500">{detail}</p></article>;
};
