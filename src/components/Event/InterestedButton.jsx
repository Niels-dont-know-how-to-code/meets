import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function InterestedButton({ count, isInterested, onToggle, size = 'sm' }) {
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    setAnimating(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAnimating(false), 300);
    onToggle();
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const sizeClasses = size === 'md'
    ? 'gap-2 text-base px-4 py-2'
    : 'gap-1 text-sm px-2 py-1';

  const iconSize = size === 'md' ? 20 : 16;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center rounded-full transition-colors ${sizeClasses} ${
        isInterested
          ? 'text-red-500 hover:text-red-600'
          : 'text-ink-tertiary hover:text-ink-secondary'
      }`}
    >
      <Heart
        size={iconSize}
        fill={isInterested ? 'currentColor' : 'none'}
        className={animating ? 'animate-pulse-heart' : ''}
      />
      <span className="font-body font-medium">{count}</span>
    </button>
  );
}
