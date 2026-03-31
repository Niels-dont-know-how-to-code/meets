import { useState, useRef, useEffect, useCallback } from 'react'
import { Clock, X, Check } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 5

function pad(n) {
  return String(n).padStart(2, '0')
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// --- Mobile: Scroll Wheel Picker ---

function ScrollColumn({ items, selected, onSelect, formatItem }) {
  const containerRef = useRef(null)
  const isScrolling = useRef(false)
  const scrollTimeout = useRef(null)

  // Scroll to selected on mount
  useEffect(() => {
    if (containerRef.current) {
      const idx = items.indexOf(selected)
      if (idx >= 0) {
        containerRef.current.scrollTop = idx * ITEM_HEIGHT
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    isScrolling.current = true
    clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false
      if (!containerRef.current) return
      const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      onSelect(items[clamped])
    }, 80)
  }, [items, onSelect])

  const handleItemClick = (item, idx) => {
    onSelect(item)
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative flex-1" style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT }}>
      {/* Center highlight band */}
      <div
        className="absolute left-1 right-1 rounded-xl bg-meets-50 pointer-events-none z-0"
        style={{ top: 2 * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="time-wheel absolute inset-0 overflow-y-scroll scrollbar-hide z-10"
        style={{
          paddingTop: 2 * ITEM_HEIGHT,
          paddingBottom: 2 * ITEM_HEIGHT,
        }}
      >
        {items.map((item, idx) => {
          const isSelected = item === selected
          return (
            <div
              key={item}
              onClick={() => handleItemClick(item, idx)}
              className={`time-wheel-item cursor-pointer select-none transition-all duration-150
                ${isSelected
                  ? 'font-display font-bold text-meets-600 text-xl'
                  : 'font-body text-ink-tertiary text-base'
                }`}
            >
              {formatItem ? formatItem(item) : pad(item)}
            </div>
          )
        })}
      </div>
      {/* Fade edges */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
    </div>
  )
}

function MobileTimePicker({ value, onChange, label, error, onOpen }) {
  const [open, setOpen] = useState(false)
  const [tempHour, setTempHour] = useState(12)
  const [tempMinute, setTempMinute] = useState(0)

  const openPicker = () => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      setTempHour(h)
      // Snap to nearest 5
      setTempMinute(Math.round(m / 5) * 5 % 60)
    } else {
      const now = new Date()
      setTempHour(now.getHours())
      setTempMinute(Math.round(now.getMinutes() / 5) * 5 % 60)
    }
    setOpen(true)
    onOpen?.()
  }

  const confirm = () => {
    onChange(`${pad(tempHour)}:${pad(tempMinute)}`)
    setOpen(false)
  }

  return (
    <>
      {/* Display input */}
      <button
        type="button"
        onClick={openPicker}
        className={`w-full px-3 py-2.5 rounded-xl bg-surface-secondary border text-left
          font-body text-sm transition-all flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-meets-500
          ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-transparent'}
          ${value ? 'text-ink' : 'text-ink-tertiary'}`}
      >
        <span>{value || '--:--'}</span>
        <Clock size={16} className="text-ink-tertiary" />
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 animate-fade-in" />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-overlay animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 -ml-1.5 rounded-full text-ink-secondary hover:bg-surface-secondary transition-colors"
              >
                <X size={20} />
              </button>
              <span className="font-display font-bold text-ink text-base">{label}</span>
              <button
                type="button"
                onClick={confirm}
                className="p-1.5 -mr-1.5 rounded-full text-meets-500 hover:bg-meets-50 transition-colors"
              >
                <Check size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Columns */}
            <div className="flex gap-2 px-6 pb-8 pt-2">
              {/* Hours label */}
              <div className="flex-1 text-center">
                <span className="text-[10px] font-display font-semibold text-ink-tertiary uppercase tracking-widest">Hour</span>
              </div>
              <div className="w-px" />
              <div className="flex-1 text-center">
                <span className="text-[10px] font-display font-semibold text-ink-tertiary uppercase tracking-widest">Min</span>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-10">
              <ScrollColumn
                items={HOURS}
                selected={tempHour}
                onSelect={setTempHour}
              />
              <div className="flex items-center justify-center w-4">
                <span className="font-display font-bold text-xl text-ink-tertiary">:</span>
              </div>
              <ScrollColumn
                items={MINUTES}
                selected={tempMinute}
                onSelect={setTempMinute}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// --- Desktop: Text Input ---

function DesktopTimePicker({ value, onChange, label, error }) {
  const [displayValue, setDisplayValue] = useState(value || '')
  const prevValid = useRef(value || '')

  useEffect(() => {
    setDisplayValue(value || '')
    if (value) prevValid.current = value
  }, [value])

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 4)

    // Auto-insert colon
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + ':' + raw.slice(2)
    }
    setDisplayValue(raw)
  }

  const handleBlur = () => {
    const match = displayValue.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
    if (match) {
      onChange(displayValue)
      prevValid.current = displayValue
    } else if (displayValue === '') {
      onChange('')
    } else {
      // Revert to last valid
      setDisplayValue(prevValid.current)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="--:--"
      maxLength={5}
      className={`w-full px-3 py-2.5 rounded-xl bg-surface-secondary border
        font-body text-sm text-ink placeholder:text-ink-tertiary
        focus:outline-none focus:ring-2 focus:ring-meets-500 transition-all
        ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-transparent'}`}
    />
  )
}

// --- Main Component ---

export default function TimePicker({ value, onChange, label, error }) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileTimePicker value={value} onChange={onChange} label={label} error={error} />
  ) : (
    <DesktopTimePicker value={value} onChange={onChange} label={label} error={error} />
  )
}
