import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarRange, X } from 'lucide-react';
import { startOfDay, addDays, nextSaturday, nextSunday, format, isSaturday, isSunday } from 'date-fns';
import { formatDateShort, getNextDay, getPrevDay, formatDateForApi } from '../../lib/dateUtils';

export default function DateNavigator({ selectedDate, onDateChange, endDate, onEndDateChange }) {
  const dateInputRef = useRef(null);
  const [showRangeOptions, setShowRangeOptions] = useState(false);

  const today = startOfDay(new Date());
  const selected = startOfDay(new Date(selectedDate));

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

  const handleRangePreset = (preset) => {
    const now = startOfDay(new Date());

    if (preset === 'weekend') {
      let satDate;
      if (isSaturday(now)) {
        satDate = now;
      } else if (isSunday(now)) {
        satDate = now;
        onDateChange(now);
        onEndDateChange(now);
        setShowRangeOptions(false);
        return;
      } else {
        satDate = nextSaturday(now);
      }
      const sunDate = isSaturday(now) ? addDays(now, 1) : nextSunday(now);
      onDateChange(satDate);
      onEndDateChange(sunDate);
    } else if (preset === '7days') {
      onDateChange(now);
      onEndDateChange(addDays(now, 6));
    }

    setShowRangeOptions(false);
  };

  const clearRange = () => {
    onEndDateChange(null);
  };

  const formatRangeLabel = () => {
    if (!endDate) return formatDateShort(selectedDate);
    const start = new Date(selectedDate);
    const end = new Date(endDate);
    return `${format(start, 'EEE d')} — ${format(end, 'EEE d')}`;
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

      <span className="font-display font-bold text-ink text-xs md:text-sm min-w-[80px] md:min-w-[100px] text-center select-none">
        {formatRangeLabel()}
      </span>

      {endDate && (
        <button
          onClick={clearRange}
          className="p-1 rounded-full text-ink-tertiary hover:bg-surface-secondary transition-colors"
          title="Clear date range"
        >
          <X size={14} />
        </button>
      )}

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

      {/* Date range button */}
      <div className="relative">
        <button
          onClick={() => setShowRangeOptions(!showRangeOptions)}
          className={`p-1.5 rounded-full transition-colors ${
            endDate
              ? 'text-meets-500 bg-meets-50'
              : 'text-meets-500 hover:bg-meets-50'
          }`}
          title="Date range"
        >
          <CalendarRange size={18} />
        </button>

        {showRangeOptions && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-float overflow-hidden z-50 min-w-[160px]">
            <button
              onClick={() => handleRangePreset('weekend')}
              className="w-full text-left px-4 py-2.5 text-xs font-display font-semibold text-ink hover:bg-surface-secondary transition-colors"
            >
              This Weekend
            </button>
            <button
              onClick={() => handleRangePreset('7days')}
              className="w-full text-left px-4 py-2.5 text-xs font-display font-semibold text-ink hover:bg-surface-secondary transition-colors border-t border-gray-50"
            >
              Next 7 Days
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
