import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { GalleryItem } from '../../types/wedding';
import { Button, EmptyState, Field, Modal, Toggle, inputClass } from './AdminPrimitives';
import type { ToastState } from './contracts';

interface GalleryManagerProps {
  items: GalleryItem[];
  onUpload: (file: File, metadata: Partial<GalleryItem>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  notify: (toast: ToastState) => void;
}

interface GalleryDraft {
  title: string;
  subtitle: string;
  altText: string;
  category: string;
  published: boolean;
}

const blankDraft: GalleryDraft = { title: '', subtitle: '', altText: '', category: 'couple', published: true };

export const GalleryManager: React.FC<GalleryManagerProps> = ({ items, onUpload, onUpdate, onDelete, notify }) => {
  const ordered = useMemo(() => [...items].sort((left, right) => left.sortOrder - right.sortOrder), [items]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [draft, setDraft] = useState<GalleryDraft>(blankDraft);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const openUpload = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setDraft(blankDraft);
    setUploadOpen(true);
  };

  const chooseFile = (nextFile: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : '');
    if (nextFile && !draft.title) {
      const title = nextFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      setDraft(current => ({ ...current, title, altText: title }));
    }
  };

  const saveUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify({ tone: 'error', message: 'Please choose an image file.' });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      notify({ tone: 'error', message: 'That photo is larger than 15 MB. Compress it before uploading.' });
      return;
    }
    setSaving(true);
    try {
      await onUpload(file, {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        altText: draft.altText.trim() || draft.title.trim(),
        category: draft.category.trim() || 'couple',
        published: draft.published,
        sortOrder: ordered.length,
      });
      notify({ tone: 'success', message: `${draft.title.trim()} was uploaded to the gallery.` });
      setUploadOpen(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'The photo could not be uploaded.' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: GalleryItem) => {
    setEditItem(item);
    setDraft({ title: item.title, subtitle: item.subtitle || '', altText: item.altText, category: item.category, published: item.published });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await onUpdate(editItem.id, {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        altText: draft.altText.trim() || draft.title.trim(),
        category: draft.category.trim(),
        published: draft.published,
      });
      notify({ tone: 'success', message: `${draft.title.trim()} was updated.` });
      setEditItem(null);
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'The photo details could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const currentItem = ordered[index];
    const targetItem = ordered[target];
    try {
      await Promise.all([
        onUpdate(currentItem.id, { sortOrder: targetItem.sortOrder }),
        onUpdate(targetItem.id, { sortOrder: currentItem.sortOrder }),
      ]);
      notify({ tone: 'success', message: 'Gallery order updated.' });
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Gallery order could not be updated.' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Media library</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-900">Public photo gallery</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">Upload optimised images, add accessible captions, arrange the story and keep drafts private until they are ready.</p>
        </div>
        <Button tone="primary" onClick={openUpload}><ImagePlus className="h-4 w-4" /> Upload photo</Button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState icon={<Camera className="h-5 w-5" />} title="The gallery is ready for your real photos" description="No placeholder images are listed here. Upload a favourite portrait or venue photo and choose when it becomes public." action={<Button tone="primary" onClick={openUpload}><UploadCloud className="h-4 w-4" /> Upload first photo</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((item, index) => (
            <article key={item.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img src={item.src} alt={item.altText} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold backdrop-blur ${item.published ? 'border-white/30 bg-emerald-600/90 text-white' : 'border-white/30 bg-stone-900/75 text-white'}`}>{item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{item.published ? 'Public' : 'Draft'}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="truncate font-serif text-base font-semibold text-stone-900">{item.title}</h3><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{item.category}</p></div>
                  <div className="flex gap-1"><Button size="sm" disabled={index === 0} onClick={() => move(index, -1)} title="Move earlier"><ArrowUp className="h-3.5 w-3.5" /></Button><Button size="sm" disabled={index === ordered.length - 1} onClick={() => move(index, 1)} title="Move later"><ArrowDown className="h-3.5 w-3.5" /></Button></div>
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-stone-500">{item.subtitle || 'No caption.'}</p>
                <div className="mt-4 flex justify-end gap-1.5 border-t border-stone-100 pt-3"><Button size="sm" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /> Edit</Button><Button size="sm" tone="danger" onClick={async () => {
                  if (!window.confirm(`Delete ${item.title}? The stored image will also be removed.`)) return;
                  try {
                    await onDelete(item.id);
                    notify({ tone: 'success', message: `${item.title} was deleted.` });
                  } catch (error) {
                    notify({ tone: 'error', message: error instanceof Error ? error.message : 'The photo could not be deleted.' });
                  }
                }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload a gallery photo" eyebrow="Public gallery">
        <form onSubmit={saveUpload} className="space-y-4">
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 bg-white p-4 text-center transition hover:border-[#c78ca0] hover:bg-[#fff9fb]">
            {previewUrl ? <img src={previewUrl} alt="Selected upload preview" className="mx-auto max-h-52 rounded-xl object-contain" /> : <><UploadCloud className="mx-auto h-8 w-8 text-stone-400" /><span className="mt-2 block text-xs font-semibold text-stone-700">Choose an image</span><span className="mt-1 block text-[10px] text-stone-400">JPG, PNG or WebP · maximum 15 MB</span></>}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => chooseFile(event.target.files?.[0] || null)} />
          </label>
          <GalleryFields draft={draft} setDraft={setDraft} />
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setUploadOpen(false)}>Cancel</Button><Button type="submit" tone="primary" disabled={saving || !file}>{saving ? 'Uploading…' : 'Upload photo'}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(editItem)} onClose={() => setEditItem(null)} title="Edit photo details" eyebrow="Gallery metadata">
        <form onSubmit={saveEdit} className="space-y-4">
          {editItem && <img src={editItem.src} alt="Current gallery item" className="max-h-52 w-full rounded-2xl bg-stone-100 object-contain" />}
          <GalleryFields draft={draft} setDraft={setDraft} />
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setEditItem(null)}>Cancel</Button><Button type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : 'Save photo details'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

const GalleryFields: React.FC<{ draft: GalleryDraft; setDraft: React.Dispatch<React.SetStateAction<GalleryDraft>> }> = ({ draft, setDraft }) => (
  <>
    <Field label="Title"><input required value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} className={inputClass} /></Field>
    <Field label="Caption"><textarea rows={2} value={draft.subtitle} onChange={event => setDraft(current => ({ ...current, subtitle: event.target.value }))} className={inputClass} /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Category"><input value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))} placeholder="couple, venue, details" className={inputClass} /></Field><Field label="Alt text" hint="Describe what is visible for screen-reader users."><input required value={draft.altText} onChange={event => setDraft(current => ({ ...current, altText: event.target.value }))} className={inputClass} /></Field></div>
    <Toggle checked={draft.published} onChange={checked => setDraft(current => ({ ...current, published: checked }))} label="Publish on the public gallery" description="Turn off to keep this photo as an admin-only draft." />
  </>
);
