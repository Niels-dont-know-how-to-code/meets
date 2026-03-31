import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS } from '../../lib/constants';
import { formatDateForApi } from '../../lib/dateUtils';
import LocationPicker from '../Map/LocationPicker';

export default function HostEventModal({ user, onClose, onSuccess, editingEvent = null }) {
  const todayStr = formatDateForApi(new Date());

  const [form, setForm] = useState({
    title: '',
    date: todayStr,
    start_time: '',
    end_time: '',
    category: '',
    organizer_name: '',
    description: '',
    lat: null,
    lng: null,
    address_label: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      // Supabase timetz comes back as "HH:MM:SS+TZ"; HTML time input needs "HH:MM"
      const trimTime = (t) => (t ? t.slice(0, 5) : '');
      setForm({
        title: editingEvent.title || '',
        date: editingEvent.date || todayStr,
        start_time: trimTime(editingEvent.start_time),
        end_time: trimTime(editingEvent.end_time),
        category: editingEvent.category || '',
        organizer_name: editingEvent.organizer_name || '',
        description: editingEvent.description || '',
        lat: editingEvent.lat ?? null,
        lng: editingEvent.lng ?? null,
        address_label: editingEvent.address_label || '',
      });
    }
  }, [editingEvent]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleLocationChange = (location) => {
    setForm((prev) => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      address_label: location.address_label || '',
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = true;
    if (!form.date) newErrors.date = true;
    if (!form.start_time) newErrors.start_time = true;
    if (!form.end_time) newErrors.end_time = true;
    if (!form.category) newErrors.category = true;
    if (!form.organizer_name.trim()) newErrors.organizer_name = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSuccess(form);
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 rounded-xl bg-surface-secondary border
      font-body text-sm text-ink placeholder:text-ink-tertiary
      focus:outline-none focus:ring-2 focus:ring-meets-500 transition-all ${
      errors[field] ? 'border-red-400 ring-1 ring-red-400' : 'border-transparent'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white
          max-h-[95vh] md:max-h-[90vh] overflow-y-auto animate-slide-up shadow-overlay"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-secondary
            transition-colors text-ink-secondary z-10"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 pt-8">
          <h2 className="font-display text-xl font-bold text-ink mb-6">
            {editingEvent ? 'Edit Event' : 'Host an Event'}
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Event title"
                className={inputClass('title')}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                min={todayStr}
                onChange={(e) => updateField('date', e.target.value)}
                className={inputClass('date')}
              />
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-sm font-medium text-ink mb-1">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  className={inputClass('start_time')}
                />
              </div>
              <div>
                <label className="block font-display text-sm font-medium text-ink mb-1">
                  End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  className={inputClass('end_time')}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={inputClass('category')}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Organizer Name */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Organizer Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.organizer_name}
                onChange={(e) => updateField('organizer_name', e.target.value)}
                placeholder="e.g., Chess Club"
                className={inputClass('organizer_name')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell people what to expect..."
                rows={3}
                className={`${inputClass('description')} resize-none`}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block font-display text-sm font-medium text-ink mb-1">
                Location
              </label>
              <LocationPicker
                value={
                  form.lat
                    ? { lat: form.lat, lng: form.lng, address_label: form.address_label }
                    : null
                }
                onChange={handleLocationChange}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full mt-6 py-3 rounded-xl font-display font-semibold
              text-base inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}
