import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Save, Settings2 } from 'lucide-react';
import type { WeddingConfig } from '../../types/wedding';
import { Button, Field, Toggle, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

type TbcField = keyof NonNullable<WeddingConfig['tbcFields']>;

interface SiteSettingsProps {
  config: WeddingConfig;
  onSave: (updates: Partial<WeddingConfig>) => Promise<void>;
  notify: (toast: ToastState) => void;
}

export const SiteSettings: React.FC<SiteSettingsProps> = ({ config, onSave, notify }) => {
  const [prevConfig, setPrevConfig] = useState<WeddingConfig>(config);
  const [draft, setDraft] = useState<WeddingConfig>(config);
  const [saving, setSaving] = useState(false);

  if (prevConfig !== config) {
    setPrevConfig(config);
    setDraft(config);
  }

  const tbc = draft.tbcFields || {};
  const setTbc = (field: TbcField, checked: boolean) => setDraft(current => ({
    ...current,
    tbcFields: { ...(current.tbcFields || {}), [field]: checked },
  }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
      notify({ tone: 'success', message: 'Website details were saved and will persist for both admins.' });
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Website settings could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const tbcCount = Object.values(tbc).filter(Boolean).length;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Single source of truth</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-900">Website settings</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">Edit confirmed facts here. Mark anything unfinished as TBC so the public experience never invents a date, promise or price.</p>
        </div>
        <Button type="submit" tone="primary" disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save all settings'}</Button>
      </div>

      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs ${tbcCount ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
        {tbcCount ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{tbcCount ? `${tbcCount} section${tbcCount === 1 ? '' : 's'} marked TBC. Guests will see a clear “details to follow” message.` : 'All core sections are marked confirmed.'}</span>
      </div>

      <SettingsSection title="Couple & date" description="Used across the site, calendar links and both invitation formats." icon={<Settings2 className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bride full name"><input value={draft.brideName} onChange={event => setDraft(current => ({ ...current, brideName: event.target.value }))} className={inputClass} /></Field>
          <Field label="Bride display name"><input value={draft.brideShortName} onChange={event => setDraft(current => ({ ...current, brideShortName: event.target.value }))} className={inputClass} /></Field>
          <Field label="Groom full name"><input value={draft.groomName} onChange={event => setDraft(current => ({ ...current, groomName: event.target.value }))} className={inputClass} /></Field>
          <Field label="Groom display name"><input value={draft.groomShortName} onChange={event => setDraft(current => ({ ...current, groomShortName: event.target.value }))} className={inputClass} /></Field>
          <Field label="Wedding date & time"><input type="datetime-local" disabled={Boolean(tbc.weddingDate)} value={draft.weddingDate ? draft.weddingDate.slice(0, 16) : ''} onChange={event => setDraft(current => ({ ...current, weddingDate: event.target.value }))} className={inputClass} /></Field>
          <Field label="Timezone"><input value={draft.timezone} onChange={event => setDraft(current => ({ ...current, timezone: event.target.value }))} placeholder="Africa/Johannesburg" className={inputClass} /></Field>
          <Field label="RSVP deadline"><input type="date" disabled={Boolean(tbc.rsvpDeadline)} value={draft.rsvpDeadline ? draft.rsvpDeadline.slice(0, 10) : ''} onChange={event => setDraft(current => ({ ...current, rsvpDeadline: event.target.value }))} className={inputClass} /></Field>
          <Field label="Contact email"><input type="email" value={draft.contactEmail} onChange={event => setDraft(current => ({ ...current, contactEmail: event.target.value }))} className={inputClass} /></Field>
          <Field label="Public site URL"><input type="url" value={draft.siteUrl} onChange={event => setDraft(current => ({ ...current, siteUrl: event.target.value }))} className={inputClass} /></Field>
          <Field label="Hashtag"><input value={draft.hashtag} onChange={event => setDraft(current => ({ ...current, hashtag: event.target.value }))} className={inputClass} /></Field>
          <Field label="Tagline" className="sm:col-span-2"><input value={draft.tagline} onChange={event => setDraft(current => ({ ...current, tagline: event.target.value }))} className={inputClass} /></Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><Toggle checked={Boolean(tbc.weddingDate)} onChange={checked => setTbc('weddingDate', checked)} label="Wedding date/time is TBC" description="Invitation and site show “Date to be confirmed.”" /><Toggle checked={Boolean(tbc.rsvpDeadline)} onChange={checked => setTbc('rsvpDeadline', checked)} label="RSVP deadline is TBC" description="The deadline is omitted until confirmed." /></div>
      </SettingsSection>

      <SettingsSection title="Ceremony venue" description="The confirmed ceremony name is retained while individual details can remain TBC." icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue name"><input value={draft.ceremonyVenue.name} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, name: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Ceremony time"><input value={draft.ceremonyVenue.time} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, time: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Address"><input value={draft.ceremonyVenue.address} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, address: event.target.value } }))} className={inputClass} /></Field>
          <Field label="City / region"><input value={draft.ceremonyVenue.city} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, city: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Google Maps URL" className="sm:col-span-2"><input type="url" value={draft.ceremonyVenue.mapUrl} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, mapUrl: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea rows={3} value={draft.ceremonyVenue.description} onChange={event => setDraft(current => ({ ...current, ceremonyVenue: { ...current.ceremonyVenue, description: event.target.value } }))} className={inputClass} /></Field>
        </div>
        <Toggle checked={Boolean(tbc.ceremonyVenue)} onChange={checked => setTbc('ceremonyVenue', checked)} label="Ceremony details are TBC" description="The site keeps the known destination context but avoids presenting unconfirmed timing or directions as fact." />
      </SettingsSection>

      <SettingsSection title="Reception & dress code" description="Keep the evening plan polished without publishing assumptions." icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reception venue"><input value={draft.receptionVenue.name} onChange={event => setDraft(current => ({ ...current, receptionVenue: { ...current.receptionVenue, name: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Reception time"><input value={draft.receptionVenue.time} onChange={event => setDraft(current => ({ ...current, receptionVenue: { ...current.receptionVenue, time: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Reception address"><input value={draft.receptionVenue.address} onChange={event => setDraft(current => ({ ...current, receptionVenue: { ...current.receptionVenue, address: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Reception city"><input value={draft.receptionVenue.city} onChange={event => setDraft(current => ({ ...current, receptionVenue: { ...current.receptionVenue, city: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Reception description" className="sm:col-span-2"><textarea rows={3} value={draft.receptionVenue.description} onChange={event => setDraft(current => ({ ...current, receptionVenue: { ...current.receptionVenue, description: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Dress code title"><input value={draft.dressCode.title} onChange={event => setDraft(current => ({ ...current, dressCode: { ...current.dressCode, title: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Dress code description"><textarea rows={3} value={draft.dressCode.description} onChange={event => setDraft(current => ({ ...current, dressCode: { ...current.dressCode, description: event.target.value } }))} className={inputClass} /></Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><Toggle checked={Boolean(tbc.receptionVenue)} onChange={checked => setTbc('receptionVenue', checked)} label="Reception details are TBC" /><Toggle checked={Boolean(tbc.dressCode)} onChange={checked => setTbc('dressCode', checked)} label="Dress code is TBC" /></div>
      </SettingsSection>
    </form>
  );
};

const SettingsSection: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
  <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3 border-b border-stone-100 pb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6e6eb] text-[#8a2947]">{icon}</div>
      <div><h3 className="font-serif text-lg font-semibold text-stone-900">{title}</h3><p className="mt-0.5 text-[11px] text-stone-500">{description}</p></div>
    </div>
    {children}
  </section>
);
