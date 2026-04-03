import { MapPin } from 'lucide-react';

export default function RadiusFilter({ radiusKm, onRadiusChange, hasGeolocation }) {
  const isActive = radiusKm !== null;

  const handleClick = () => {
    if (isActive) {
      onRadiusChange(null);
    } else {
      if (!hasGeolocation) return;
      onRadiusChange(50);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`floating-btn px-3 py-2.5 rounded-full text-xs font-display font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
        isActive
          ? 'bg-meets-50 text-meets-600 border-meets-200'
          : ''
      }`}
    >
      <MapPin size={14} />
      {isActive ? `Within ${radiusKm}km` : 'All areas'}
    </button>
  );
}
