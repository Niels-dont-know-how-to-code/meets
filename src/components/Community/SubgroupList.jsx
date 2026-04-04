import { Plus, Hash, Users, Lock } from 'lucide-react'

export default function SubgroupList({ subgroups, onSelect, isAdmin, onCreateSubgroup }) {
  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-ink-secondary uppercase tracking-wider">
          Groups
        </h3>
        {isAdmin && (
          <button
            onClick={onCreateSubgroup}
            className="p-1.5 rounded-lg bg-meets-50 text-meets-500 hover:bg-meets-100 transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Empty state */}
      {subgroups.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
            <Hash size={24} className="text-ink-tertiary" />
          </div>
          <p className="font-body text-sm text-ink-tertiary">No groups yet</p>
          {isAdmin && (
            <button
              onClick={onCreateSubgroup}
              className="mt-3 text-sm font-display font-medium text-meets-500 hover:text-meets-600"
            >
              Create the first group
            </button>
          )}
        </div>
      )}

      {/* Subgroup list */}
      <div className="space-y-1.5">
        {subgroups.map(group => (
          <button
            key={group.id}
            onClick={() => onSelect(group)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary
              transition-colors text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-ink-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm text-ink truncate">
                {group.name}
              </p>
              {group.description && (
                <p className="font-body text-xs text-ink-tertiary truncate">
                  {group.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-ink-tertiary">
              <Users size={12} />
              <span className="text-[10px] font-body">{group.member_count}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
