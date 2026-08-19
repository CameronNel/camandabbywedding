import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastState } from './contracts';

export const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#bd7890] focus:ring-2 focus:ring-[#f1dce3] disabled:cursor-not-allowed disabled:bg-stone-100';
export const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}> = ({ tone = 'secondary', size = 'md', className = '', type = 'button', ...props }) => {
  const tones = {
    primary: 'bg-[#7f2540] text-white hover:bg-[#671d34] border-[#7f2540] shadow-sm',
    secondary: 'bg-white text-stone-700 hover:bg-[#fff7fa] hover:border-[#d6a5b4] border-stone-200',
    danger: 'bg-white text-rose-700 hover:bg-rose-50 border-rose-200',
    ghost: 'bg-transparent text-stone-600 hover:bg-stone-100 border-transparent',
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-4 py-2.5 text-xs'} ${tones[tone]} ${className}`}
      {...props}
    />
  );
};

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className={labelClass}>{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-[10px] leading-relaxed text-stone-400">{hint}</span>}
  </label>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => (
  <label className={`flex items-start gap-3 rounded-xl border p-3 transition ${checked ? 'border-[#d5a2b2] bg-[#fff6f8]' : 'border-stone-200 bg-white'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={event => onChange(event.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#8a2947] focus:ring-[#bd7890]"
    />
    <span>
      <span className="block text-xs font-semibold text-stone-800">{label}</span>
      {description && <span className="mt-0.5 block text-[10px] leading-relaxed text-stone-500">{description}</span>}
    </span>
  </label>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">{icon}</div>
    <h3 className="font-serif text-lg font-semibold text-stone-800">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-500">{description}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, eyebrow, children, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center overflow-y-auto bg-stone-950/65 p-3 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={`my-auto max-h-[92vh] w-full overflow-y-auto rounded-[1.75rem] border border-white/30 bg-[#fbfaf8] shadow-2xl ${maxWidth}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            {eyebrow && <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#a35a70]">{eyebrow}</p>}
            <h2 className="font-serif text-xl font-semibold text-stone-900">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100" aria-label="Close dialog"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

export const Toast: React.FC<ToastState & { onClose: () => void }> = ({ tone, message, onClose }) => {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  };
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Info;
  return (
    <div className={`fixed bottom-5 left-1/2 z-[100020] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-2xl border px-4 py-3 text-xs shadow-xl ${styles[tone]}`} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1 leading-relaxed">{message}</span>
      <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
};
