import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  title,
  onClose,
  children,
  width = 'max-w-md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className={`w-screen ${width} bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slideInRight`}>
          {/* Header matching screenshot */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors mr-2"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
