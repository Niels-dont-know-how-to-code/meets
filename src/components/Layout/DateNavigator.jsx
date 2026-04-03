import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { startOfDay } from 'date-fns';
import { formatDateShort, getNextDay, getPrevDay, formatDateForApi } from '../../lib/dateUtils';

export default function DateNavigator({ selectedDate, onDateChange }) {
  const dateInputRef = useRef(null);

  const today = startOfDay(new Date());
  const selected = startOfDay(new Date(selectedDate));
  const isPastDisabled = selected <= today;
  const todayStr = formatDateForApi(new Date());

  const handlePrev = () => {
    if (!isPastDisabled) onDateChange(getPrevDay(selectedDate));
  };

  const handleNext = () => {
    onDateChange(getNextDay(selectedDate));
  };

  const handleCalendarClick = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click?.();
  };

  const handleDateInput = (e) => {
    if (e.target.value) onDateChange(e.target.value);
  };

  return (
    <div className="floating-btn flex items-center gap-0.5 px-2 py-1.5 rounded-2xl">
      <button
        onClick={handlePrev}
        disabled={isPastDisabled}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
          isPastDisabled
            ? 'text-ink-tertiary cursor-not-allowed'
            : 'text-ink hover:bg-surface-secondary'
        }`}
      >
        <ChevronLeft size={18} />
      </button>

      <span className="font-display font-bold text-ink text-xs min-w-[70px] text-center select-none">
        {formatDateShort(selectedDate)}
      </span>

      <button
        onClick={handleNext}
        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-ink hover:bg-surface-secondary transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      <div className="relative">
        <button
          onClick={handleCalendarClick}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-meets-500 hover:bg-meets-50 transition-colors"
        >
          <Calendar size={16} />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          min={todayStr}
          value={formatDateForApi(selectedDate)}
          onChange={handleDateInput}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
