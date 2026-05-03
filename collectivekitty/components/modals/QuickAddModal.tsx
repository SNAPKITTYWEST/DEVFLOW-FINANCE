import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { DealStage, ContactId, makeContactId } from '@/lib/types/branded';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type QuickAddResult = {
  id: string;
  type: 'contact' | 'deal';
  name: string;
};

export type ModalState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; result: QuickAddResult }
  | { status: 'error'; message: string };

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<QuickAddResult>;
  type: 'contact' | 'deal';
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type
}) => {
  const [state, setState] = useState<ModalState>({ status: 'idle' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.status === 'idle') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.querySelector('input')?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, state.status, onClose]);

  // Auto-close on success
  useEffect(() => {
    if (state.status === 'success') {
      const timer = setTimeout(() => {
        onClose();
        setState({ status: 'idle' });
        setFormData({});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  if (!isOpen) return null;

  const validateField = (name: string, value: string) => {
    let error = '';
    if (!value) error = 'Required field';
    else if (name === 'email' && !/^\S+@\S+\.\S+$/.test(value)) error = 'Invalid email';

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateField(e.target.name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === 'submitting') return;

    // Final validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Required';
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    setState({ status: 'submitting' });
    try {
      const result = await onSubmit(formData);
      setState({ status: 'success', result });
    } catch (error: any) {
      setState({ status: 'error', message: error.message || 'Submission failed' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus size={20} className="text-purple-500" />
            Quick Add {type === 'contact' ? 'Contact' : 'Deal'}
          </h3>
          <button
            onClick={onClose}
            disabled={state.status === 'submitting'}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
            <input
              name="name"
              type="text"
              required
              disabled={state.status === 'submitting' || state.status === 'success'}
              className={cn(
                "w-full bg-zinc-950 border px-4 py-2.5 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 transition-all",
                errors.name ? "border-red-500/50 focus:ring-red-500/10" : "border-zinc-800 focus:ring-purple-500/10 focus:border-purple-500/50"
              )}
              placeholder="e.g. Tony Stark"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              onBlur={handleBlur}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold px-1">{errors.name}</p>}
          </div>

          {type === 'contact' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
              <input
                name="email"
                type="email"
                disabled={state.status === 'submitting' || state.status === 'success'}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all"
                placeholder="tony@stark.com"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onBlur={handleBlur}
              />
            </div>
          ) : (
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Deal Value (USD)</label>
              <input
                name="value"
                type="number"
                disabled={state.status === 'submitting' || state.status === 'success'}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-mono"
                placeholder="250000"
                value={formData.value || ''}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={state.status === 'submitting' || state.status === 'success'}
              className={cn(
                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                state.status === 'success'
                  ? "bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                  : state.status === 'error'
                  ? "bg-red-500 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50"
              )}
            >
              {state.status === 'submitting' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : state.status === 'success' ? (
                <CheckCircle2 size={20} />
              ) : state.status === 'error' ? (
                <AlertCircle size={20} />
              ) : (
                <>Create {type === 'contact' ? 'Contact' : 'Deal'}</>
              )}
            </button>
            {state.status === 'error' && (
              <p className="mt-2 text-center text-xs text-red-400 font-medium">{state.message}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
