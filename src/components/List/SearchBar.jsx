import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search events...' }) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-secondary border-none
          font-body text-sm text-ink placeholder:text-ink-tertiary
          focus:outline-none focus:ring-2 focus:ring-meets-500 transition-shadow"
      />
    </div>
  );
}
