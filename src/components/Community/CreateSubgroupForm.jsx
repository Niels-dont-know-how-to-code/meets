import { useState } from 'react'
import { Hash, Loader2 } from 'lucide-react'

export default function CreateSubgroupForm({ onSubmit, onCancel }) {
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
        <div className="w-16 h-16 rounded-xl bg-surface-tertiary flex items-center justify-center mb-3">
          <Hash size={28} className="text-ink-tertiary" />
        </div>
        <p className="font-display font-bold text-base text-ink">
          {name.trim() || 'New Group'}
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block font-display font-medium text-sm text-ink mb-1.5">
          Group Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Event Planning"
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
          placeholder="What is this group for?"
          maxLength={300}
          rows={2}
          className="w-full font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5
            bg-white focus:outline-none focus:ring-2 focus:ring-meets-500 focus:border-transparent
            resize-none"
        />
        <p className="text-[11px] text-ink-tertiary mt-1 font-body">{description.length}/300</p>
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
            'Create Group'
          )}
        </button>
      </div>
    </form>
  )
}
