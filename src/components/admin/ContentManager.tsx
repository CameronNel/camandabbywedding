import React, { useMemo, useState } from 'react';
import {
  BedDouble,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Accommodation, ContentVisibility, RegistryItem, WeddingService } from '../../types/wedding';
import { Button, EmptyState, Field, Modal, Toggle, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

type ContentTab = 'accommodations' | 'services' | 'wishlist';
type PriceSort = 'low' | 'high' | 'manual';

interface ContentManagerProps {
  accommodations: Accommodation[];
  services: WeddingService[];
  registryItems: RegistryItem[];
  onAddAccommodation: (item: Omit<Accommodation, 'id'>) => Promise<void>;
  onUpdateAccommodation: (id: string, item: Partial<Accommodation>) => Promise<void>;
  onDeleteAccommodation: (id: string) => Promise<void>;
  onAddService: (item: Omit<WeddingService, 'id'>) => Promise<void>;
  onUpdateService: (id: string, item: Partial<WeddingService>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onAddRegistry: (item: Omit<RegistryItem, 'id'>) => Promise<void>;
  onUpdateRegistry: (id: string, item: Partial<RegistryItem>) => Promise<void>;
  onDeleteRegistry: (id: string) => Promise<void>;
  notify: (toast: ToastState) => void;
}

const blankAccommodation = (): Omit<Accommodation, 'id'> => ({
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  bookingCode: '',
  distance: '',
  link: '',
  rate: '',
  priceAmount: undefined,
  currency: 'ZAR',
  priceUnit: 'per night',
  visibility: 'general',
  isVenueHousing: false,
  published: false,
  sortOrder: 0,
});

const blankService = (): Omit<WeddingService, 'id'> => ({
  category: '',
  name: '',
  description: '',
  contactName: '',
  phone: '',
  email: '',
  link: '',
  priceAmount: undefined,
  currency: 'ZAR',
  priceUnit: 'per booking',
  visibility: 'general',
  published: false,
  sortOrder: 0,
});

const blankRegistry = (): Omit<RegistryItem, 'id'> => ({
  title: '',
  description: '',
  type: 'registry',
  icon: 'Gift',
  link: '',
  goalAmount: undefined,
  currentAmount: 0,
  accountDetails: '',
  published: false,
  sortOrder: 0,
});

const money = (amount: number | undefined, currency: string, unit: string): string => {
  if (amount === undefined) return 'Price on request';
  if (amount === 0) return 'Complimentary';
  try {
    return `${new Intl.NumberFormat('en-ZA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)} ${unit}`;
  } catch {
    return `${currency} ${amount.toLocaleString()} ${unit}`;
  }
};

const sortPriced = <T extends { priceAmount?: number; sortOrder: number }>(items: T[], sort: PriceSort): T[] => [...items].sort((left, right) => {
  if (sort === 'manual') return left.sortOrder - right.sortOrder;
  const leftPrice = left.priceAmount ?? Number.POSITIVE_INFINITY;
  const rightPrice = right.priceAmount ?? Number.POSITIVE_INFINITY;
  return sort === 'low' ? leftPrice - rightPrice : rightPrice - leftPrice;
});

const VisibilityBadge: React.FC<{ visibility: ContentVisibility }> = ({ visibility }) => (
  <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${visibility === 'free_venue_housing' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-600'}`}>
    {visibility === 'free_venue_housing' ? 'Housing-tag only' : visibility === 'all' ? 'All identified guests' : 'General guests'}
  </span>
);

export const ContentManager: React.FC<ContentManagerProps> = props => {
  const [tab, setTab] = useState<ContentTab>('accommodations');
  const [priceSort, setPriceSort] = useState<PriceSort>('low');
  const [accommodationEditor, setAccommodationEditor] = useState(false);
  const [serviceEditor, setServiceEditor] = useState(false);
  const [registryEditor, setRegistryEditor] = useState(false);
  const [editingAccommodationId, setEditingAccommodationId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingRegistryId, setEditingRegistryId] = useState<string | null>(null);
  const [accommodationDraft, setAccommodationDraft] = useState(blankAccommodation);
  const [serviceDraft, setServiceDraft] = useState(blankService);
  const [registryDraft, setRegistryDraft] = useState(blankRegistry);
  const [saving, setSaving] = useState(false);

  const accommodations = useMemo(() => sortPriced(props.accommodations, priceSort), [priceSort, props.accommodations]);
  const services = useMemo(() => sortPriced(props.services, priceSort), [priceSort, props.services]);
  const registry = useMemo(() => [...props.registryItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [props.registryItems]);

  const editAccommodation = (item?: Accommodation) => {
    setEditingAccommodationId(item?.id || null);
    setAccommodationDraft(item ? { ...item } : blankAccommodation());
    setAccommodationEditor(true);
  };
  const editService = (item?: WeddingService) => {
    setEditingServiceId(item?.id || null);
    setServiceDraft(item ? { ...item } : blankService());
    setServiceEditor(true);
  };
  const editRegistry = (item?: RegistryItem) => {
    setEditingRegistryId(item?.id || null);
    setRegistryDraft(item ? { ...item } : blankRegistry());
    setRegistryEditor(true);
  };

  const saveAccommodation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...accommodationDraft,
        name: accommodationDraft.name.trim(),
        description: accommodationDraft.description?.trim(),
        priceAmount: accommodationDraft.isVenueHousing ? 0 : accommodationDraft.priceAmount,
        visibility: accommodationDraft.isVenueHousing ? 'free_venue_housing' as const : accommodationDraft.visibility,
        rate: accommodationDraft.priceAmount === undefined ? accommodationDraft.rate : money(accommodationDraft.isVenueHousing ? 0 : accommodationDraft.priceAmount, accommodationDraft.currency, accommodationDraft.priceUnit),
      };
      if (editingAccommodationId) await props.onUpdateAccommodation(editingAccommodationId, payload);
      else await props.onAddAccommodation(payload);
      props.notify({ tone: 'success', message: `${payload.name} was ${editingAccommodationId ? 'updated' : 'added'}.` });
      setAccommodationEditor(false);
    } catch (error) {
      props.notify({ tone: 'error', message: error instanceof Error ? error.message : 'Accommodation could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const saveService = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...serviceDraft,
        name: serviceDraft.name.trim(),
        category: serviceDraft.category.trim(),
        visibility: 'general' as const,
      };
      if (editingServiceId) await props.onUpdateService(editingServiceId, payload);
      else await props.onAddService(payload);
      props.notify({ tone: 'success', message: `${payload.name} was ${editingServiceId ? 'updated' : 'added'}.` });
      setServiceEditor(false);
    } catch (error) {
      props.notify({ tone: 'error', message: error instanceof Error ? error.message : 'Service could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const saveRegistry = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...registryDraft, title: registryDraft.title.trim(), description: registryDraft.description.trim() };
      if (editingRegistryId) await props.onUpdateRegistry(editingRegistryId, payload);
      else await props.onAddRegistry(payload);
      props.notify({ tone: 'success', message: `${payload.title} was ${editingRegistryId ? 'updated' : 'added'}.` });
      setRegistryEditor(false);
    } catch (error) {
      props.notify({ tone: 'error', message: error instanceof Error ? error.message : 'Wishlist item could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (label: string, callback: () => Promise<void>) => {
    if (!window.confirm(`Delete ${label}? This removes it from the public site.`)) return;
    try {
      await callback();
      props.notify({ tone: 'success', message: `${label} was deleted.` });
    } catch (error) {
      props.notify({ tone: 'error', message: error instanceof Error ? error.message : `${label} could not be deleted.` });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Guest-facing content</p>
        <h2 className="font-serif text-2xl font-semibold text-stone-900">Stay, services &amp; wishlist</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">Only published records appear publicly. Numeric pricing keeps the cheap-to-expensive filters accurate; access rules decide which identified guests may see each option.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
          {([
            ['accommodations', `Accommodation (${props.accommodations.length})`],
            ['services', `Services (${props.services.length})`],
            ['wishlist', `Wishlist (${props.registryItems.length})`],
          ] as Array<[ContentTab, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition sm:text-xs ${tab === value ? 'bg-white text-[#7f2540] shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab !== 'wishlist' && (
            <label className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <select value={priceSort} onChange={event => setPriceSort(event.target.value as PriceSort)} className={`${inputClass} py-2 pl-8 text-xs`}>
                <option value="low">Cheapest first</option><option value="high">Most expensive first</option><option value="manual">Manual order</option>
              </select>
            </label>
          )}
          <Button tone="primary" onClick={() => tab === 'accommodations' ? editAccommodation() : tab === 'services' ? editService() : editRegistry()}><Plus className="h-4 w-4" /> Add {tab === 'wishlist' ? 'item' : tab === 'services' ? 'service' : 'stay'}</Button>
        </div>
      </div>

      {tab === 'accommodations' && (accommodations.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accommodations.map(item => (
            <article key={item.id} className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6e6eb] text-[#8a2947]"><BedDouble className="h-5 w-5" /></div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${item.published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-500'}`}>{item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{item.published ? 'Published' : 'Draft'}</span>
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">{item.name}</h3>
              <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-stone-500">{item.description || item.address || 'No description yet.'}</p>
              <p className="mt-4 text-sm font-semibold text-[#7f2540]">{money(item.priceAmount, item.currency, item.priceUnit)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5"><VisibilityBadge visibility={item.visibility} />{item.isVenueHousing && <span className="rounded-full border border-[#dcc5a1] bg-[#fff9ed] px-2 py-1 text-[9px] font-semibold text-[#8a6527]">Provided on-site</span>}</div>
              <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4">
                {item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 hover:text-[#7f2540]">Open link <ExternalLink className="h-3 w-3" /></a> : <span />}
                <div className="flex gap-1.5"><Button size="sm" onClick={() => editAccommodation(item)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" tone="danger" onClick={() => deleteItem(item.name, () => props.onDeleteAccommodation(item.id))}><Trash2 className="h-3.5 w-3.5" /></Button></div>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={<BedDouble className="h-5 w-5" />} title="No accommodation options yet" description="Add confirmed stays only. Mark complimentary venue housing so it is shown exclusively to tagged households." action={<Button tone="primary" onClick={() => editAccommodation()}><Plus className="h-4 w-4" /> Add accommodation</Button>} />)}

      {tab === 'services' && (services.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map(item => (
            <article key={item.id} className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1eee8] text-[#7e6b52]"><Sparkles className="h-5 w-5" /></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-stone-500">{item.category || 'Uncategorised'}</span></div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">{item.name}</h3>
              <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-stone-500">{item.description || 'No description yet.'}</p>
              <p className="mt-4 text-sm font-semibold text-[#7f2540]">{money(item.priceAmount, item.currency, item.priceUnit)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5"><VisibilityBadge visibility={item.visibility} /><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${item.published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-500'}`}>{item.published ? 'Published' : 'Draft'}</span></div>
              <div className="mt-auto flex justify-end gap-1.5 border-t border-stone-100 pt-4"><Button size="sm" onClick={() => editService(item)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" tone="danger" onClick={() => deleteItem(item.name, () => props.onDeleteService(item.id))}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No guest services yet" description="Add only useful, confirmed services such as transport, beauty, childcare or local activities, each with a transparent numeric price." action={<Button tone="primary" onClick={() => editService()}><Plus className="h-4 w-4" /> Add service</Button>} />)}

      {tab === 'wishlist' && (registry.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {registry.map(item => (
            <article key={item.id} className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6e6eb] text-[#8a2947]"><Gift className="h-5 w-5" /></div><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${item.published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-500'}`}>{item.published ? 'Published' : 'Draft'}</span></div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">{item.title}</h3><p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-stone-500">{item.description}</p>
              {item.goalAmount !== undefined && <p className="mt-4 text-xs font-semibold text-[#7f2540]">R{(item.currentAmount || 0).toLocaleString()} of R{item.goalAmount.toLocaleString()}</p>}
              <div className="mt-auto flex justify-end gap-1.5 border-t border-stone-100 pt-4"><Button size="sm" onClick={() => editRegistry(item)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" tone="danger" onClick={() => deleteItem(item.title, () => props.onDeleteRegistry(item.id))}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={<Gift className="h-5 w-5" />} title="No wishlist items yet" description="Start with a blank, honest wishlist. Banking details remain hidden from households tagged “Presence is our gift.”" action={<Button tone="primary" onClick={() => editRegistry()}><Plus className="h-4 w-4" /> Add wishlist item</Button>} />)}

      <Modal open={accommodationEditor} onClose={() => setAccommodationEditor(false)} title={editingAccommodationId ? 'Edit accommodation' : 'Add accommodation'} eyebrow="Stay option" maxWidth="max-w-2xl">
        <form onSubmit={saveAccommodation} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><input required value={accommodationDraft.name} onChange={e => setAccommodationDraft(d => ({ ...d, name: e.target.value }))} className={inputClass} /></Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={3} value={accommodationDraft.description} onChange={e => setAccommodationDraft(d => ({ ...d, description: e.target.value }))} className={inputClass} /></Field>
            <Field label="Address"><input value={accommodationDraft.address} onChange={e => setAccommodationDraft(d => ({ ...d, address: e.target.value }))} className={inputClass} /></Field>
            <Field label="Distance / travel time"><input value={accommodationDraft.distance} onChange={e => setAccommodationDraft(d => ({ ...d, distance: e.target.value }))} placeholder="12 min from venue" className={inputClass} /></Field>
            <Field label="Phone"><input value={accommodationDraft.phone} onChange={e => setAccommodationDraft(d => ({ ...d, phone: e.target.value }))} className={inputClass} /></Field>
            <Field label="Email"><input type="email" value={accommodationDraft.email} onChange={e => setAccommodationDraft(d => ({ ...d, email: e.target.value }))} className={inputClass} /></Field>
            <Field label="Booking code"><input value={accommodationDraft.bookingCode} onChange={e => setAccommodationDraft(d => ({ ...d, bookingCode: e.target.value }))} className={inputClass} /></Field>
            <Field label="Booking URL"><input type="url" value={accommodationDraft.link} onChange={e => setAccommodationDraft(d => ({ ...d, link: e.target.value }))} className={inputClass} /></Field>
            <Field label="Numeric price"><input type="number" min={0} value={accommodationDraft.priceAmount ?? ''} disabled={accommodationDraft.isVenueHousing} onChange={e => setAccommodationDraft(d => ({ ...d, priceAmount: e.target.value === '' ? undefined : Number(e.target.value) }))} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Currency"><input value={accommodationDraft.currency} onChange={e => setAccommodationDraft(d => ({ ...d, currency: e.target.value.toUpperCase() }))} className={inputClass} /></Field><Field label="Price unit"><input value={accommodationDraft.priceUnit} onChange={e => setAccommodationDraft(d => ({ ...d, priceUnit: e.target.value }))} className={inputClass} /></Field></div>
            <Field label="Who can see it"><input readOnly value={accommodationDraft.isVenueHousing ? 'Households with venue housing' : 'General households after RSVP'} className={`${inputClass} bg-stone-50 text-stone-500`} /></Field>
            <Field label="Manual sort order"><input type="number" value={accommodationDraft.sortOrder} onChange={e => setAccommodationDraft(d => ({ ...d, sortOrder: Number(e.target.value) }))} className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Toggle checked={accommodationDraft.isVenueHousing} onChange={checked => setAccommodationDraft(d => ({ ...d, isVenueHousing: checked }))} label="Complimentary venue housing" description="Price becomes zero and only tagged households may see it." /><Toggle checked={accommodationDraft.published} onChange={checked => setAccommodationDraft(d => ({ ...d, published: checked }))} label="Publish on site" description="Keep off until every detail has been confirmed." /></div>
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setAccommodationEditor(false)}>Cancel</Button><Button type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : 'Save accommodation'}</Button></div>
        </form>
      </Modal>

      <Modal open={serviceEditor} onClose={() => setServiceEditor(false)} title={editingServiceId ? 'Edit service' : 'Add service'} eyebrow="Guest service" maxWidth="max-w-2xl">
        <form onSubmit={saveService} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><input required value={serviceDraft.category} onChange={e => setServiceDraft(d => ({ ...d, category: e.target.value }))} placeholder="Transport, beauty, childcare…" className={inputClass} /></Field>
            <Field label="Service name"><input required value={serviceDraft.name} onChange={e => setServiceDraft(d => ({ ...d, name: e.target.value }))} className={inputClass} /></Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={3} value={serviceDraft.description} onChange={e => setServiceDraft(d => ({ ...d, description: e.target.value }))} className={inputClass} /></Field>
            <Field label="Contact name"><input value={serviceDraft.contactName} onChange={e => setServiceDraft(d => ({ ...d, contactName: e.target.value }))} className={inputClass} /></Field>
            <Field label="Phone"><input value={serviceDraft.phone} onChange={e => setServiceDraft(d => ({ ...d, phone: e.target.value }))} className={inputClass} /></Field>
            <Field label="Email"><input type="email" value={serviceDraft.email} onChange={e => setServiceDraft(d => ({ ...d, email: e.target.value }))} className={inputClass} /></Field>
            <Field label="Website"><input type="url" value={serviceDraft.link} onChange={e => setServiceDraft(d => ({ ...d, link: e.target.value }))} className={inputClass} /></Field>
            <Field label="Numeric price"><input type="number" min={0} value={serviceDraft.priceAmount ?? ''} onChange={e => setServiceDraft(d => ({ ...d, priceAmount: e.target.value === '' ? undefined : Number(e.target.value) }))} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Currency"><input value={serviceDraft.currency} onChange={e => setServiceDraft(d => ({ ...d, currency: e.target.value.toUpperCase() }))} className={inputClass} /></Field><Field label="Price unit"><input value={serviceDraft.priceUnit} onChange={e => setServiceDraft(d => ({ ...d, priceUnit: e.target.value }))} className={inputClass} /></Field></div>
            <Field label="Who can see it"><input readOnly value="General households after RSVP" className={`${inputClass} bg-stone-50 text-stone-500`} /></Field>
            <Field label="Manual sort order"><input type="number" value={serviceDraft.sortOrder} onChange={e => setServiceDraft(d => ({ ...d, sortOrder: Number(e.target.value) }))} className={inputClass} /></Field>
          </div>
          <Toggle checked={serviceDraft.published} onChange={checked => setServiceDraft(d => ({ ...d, published: checked }))} label="Publish on site" description="Guests only see published, confirmed services." />
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setServiceEditor(false)}>Cancel</Button><Button type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : 'Save service'}</Button></div>
        </form>
      </Modal>

      <Modal open={registryEditor} onClose={() => setRegistryEditor(false)} title={editingRegistryId ? 'Edit wishlist item' : 'Add wishlist item'} eyebrow="Gift registry">
        <form onSubmit={saveRegistry} className="space-y-4">
          <Field label="Title"><input required value={registryDraft.title} onChange={e => setRegistryDraft(d => ({ ...d, title: e.target.value }))} className={inputClass} /></Field>
          <Field label="Description"><textarea required rows={3} value={registryDraft.description} onChange={e => setRegistryDraft(d => ({ ...d, description: e.target.value }))} className={inputClass} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Type"><select value={registryDraft.type} onChange={e => setRegistryDraft(d => ({ ...d, type: e.target.value as RegistryItem['type'] }))} className={inputClass}><option value="registry">Store registry</option><option value="honeymoon">Honeymoon fund</option><option value="cash">Bank transfer</option></select></Field><Field label="Link"><input type="url" value={registryDraft.link} onChange={e => setRegistryDraft(d => ({ ...d, link: e.target.value }))} className={inputClass} /></Field></div>
          {registryDraft.type === 'honeymoon' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Goal amount"><input type="number" min={0} value={registryDraft.goalAmount ?? ''} onChange={e => setRegistryDraft(d => ({ ...d, goalAmount: e.target.value === '' ? undefined : Number(e.target.value) }))} className={inputClass} /></Field><Field label="Current amount"><input type="number" min={0} value={registryDraft.currentAmount ?? ''} onChange={e => setRegistryDraft(d => ({ ...d, currentAmount: Number(e.target.value) }))} className={inputClass} /></Field></div>}
          {registryDraft.type === 'cash' && <Field label="Bank / payment details" hint="These are hidden completely for no-gift households."><textarea rows={3} value={registryDraft.accountDetails} onChange={e => setRegistryDraft(d => ({ ...d, accountDetails: e.target.value }))} className={inputClass} /></Field>}
          <div className="grid gap-3 sm:grid-cols-2"><Toggle checked={Boolean(registryDraft.published)} onChange={checked => setRegistryDraft(d => ({ ...d, published: checked }))} label="Publish item" /><Field label="Sort order"><input type="number" value={registryDraft.sortOrder || 0} onChange={e => setRegistryDraft(d => ({ ...d, sortOrder: Number(e.target.value) }))} className={inputClass} /></Field></div>
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setRegistryEditor(false)}>Cancel</Button><Button type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : 'Save wishlist item'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};
