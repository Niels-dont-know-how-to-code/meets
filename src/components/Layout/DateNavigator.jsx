import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateShort, getNextDay, getPrevDay, formatDateForApi } from '../../lib/dateUtils';

export default function DateNavigator({ selectedDate, onDateChange }) {
  const dateInputRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);

  const isPastDisabled = selected <= today;

  const todayStr = formatDateForApi(new Date());

  const handlePrev = () => {
    if (!isPastDisabled) {
      onDateChange(getPrevDay(selectedDate));
    }
  };

  const handleNext = () => {
    onDateChange(getNextDay(selectedDate));
  };

  const handleCalendarClick = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click?.();
  };

  const handleDateInput = (e) => {
    if (e.target.value) {
      onDateChange(e.target.value);
    }
  };

  return (
    <div className="floating-btn flex items-center gap-1 px-3 py-2 rounded-2xl">
      <button
        onClick={handlePrev}
        disabled={isPastDisabled}
        className={`p-1.5 rounded-full transition-colors ${
          isPastDisabled
            ? 'text-ink-tertiary cursor-not-allowed'
            : 'text-ink hover:bg-surface-secondary'
        }`}
      >
        <ChevronLeft size={20} />
      </button>

      <span className="font-display font-bold text-ink text-sm min-w-[100px] text-center select-none">
        {formatDateShort(selectedDate)}
      </span>

      <button
        onClick={handleNext}
        className="p-1.5 rounded-full text-ink hover:bg-surface-secondary transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <div className="relative">
        <button
          onClick={handleCalendarClick}
          className="p-1.5 rounded-full text-meets-500 hover:bg-meets-50 transition-colors"
        >
          <Calendar size={18} />
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
