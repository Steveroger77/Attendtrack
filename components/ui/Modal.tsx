
import React, { useEffect } from 'react';
import { ICONS } from '../../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div 
        className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/50 w-full max-w-6xl max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 id={titleId} className="text-xl font-bold text-gray-200">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors" aria-label="Close modal">
            {ICONS.close}
          </button>
        </header>
        <main className="p-1 md:p-2 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in { 
          animation: fade-in 0.3s ease-out forwards;
          will-change: opacity;
        }
        .animate-slide-up { 
          animation: slide-up 0.4s ease-out forwards;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

export default Modal;
