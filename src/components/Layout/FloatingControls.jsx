import { List, X } from 'lucide-react';

export default function FloatingControls({ onToggleList, showList }) {
  return (
    <button
      onClick={onToggleList}
      className="floating-btn p-3 rounded-full bg-white shadow-float
        text-ink hover:shadow-float-lg transition-shadow"
      aria-label={showList ? 'Close list' : 'Open list'}
    >
      {showList ? <X size={22} /> : <List size={22} />}
    </button>
  );
}
