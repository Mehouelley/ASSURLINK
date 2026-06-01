import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full ${sizes[size]} max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] border border-white/60 sm:rounded-3xl rounded-t-3xl animate-[modalIn_.18s_ease-out]`}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{title}</h2>
            <div className="mt-1 h-1 w-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          </div>
          <button onClick={onClose} className="shrink-0 p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700" aria-label="Fermer la fenêtre">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 scrollbar-thin bg-white">{children}</div>
      </div>
    </div>
  );
}
