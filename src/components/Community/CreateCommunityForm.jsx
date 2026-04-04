import { useState } from 'react'
import { Users, Loader2 } from 'lucide-react'

export default function CreateCommunityForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    await onSubmit({ name: name.trim(), description: description.trim() })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
      {/* Preview */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full bg-meets-500 flex items-center justify-center text-white mb-3">
          {name.trim() ? (
            <span className="font-display font-bold text-2xl">
              {name.trim().charAt(0).toUpperCase()}
            </span>
          ) : (
            <Users size={32} />
          )}
        </div>
        <p className="font-display font-bold text-lg text-ink">
          {name.trim() || 'Your Community'}
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block font-display font-medium text-sm text-ink mb-1.5">
          Community Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., VTK Leuven"
          maxLength={100}
          className="w-full font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5
            bg-white focus:outline-none focus:ring-2 focus:ring-meets-500 focus:border-transparent"
          autoFocus
        />
        <p className="text-[11px] text-ink-tertiary mt-1 font-body">{name.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label className="block font-display font-medium text-sm text-ink mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this community about?"
          maxLength={500}
          rows={3}
          className="w-full font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5
            bg-white focus:outline-none focus:ring-2 focus:ring-meets-500 focus:border-transparent
            resize-none"
        />
        <p className="text-[11px] text-ink-tertiary mt-1 font-body">{description.length}/500</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 py-2.5 text-sm font-display font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="btn-primary flex-1 py-2.5 text-sm font-display font-medium
            inline-flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            'Create'
          )}
        </button>
      </div>
    </form>
  )
}
