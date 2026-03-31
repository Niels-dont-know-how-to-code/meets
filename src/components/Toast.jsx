import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-50 animate-toast-in max-w-[90vw]">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-float-lg font-body text-sm font-medium
          ${isError ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
      >
        {isError ? (
          <AlertCircle size={18} className="shrink-0" />
        ) : (
          <CheckCircle size={18} className="shrink-0" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
