export default function SkeletonCard() {
  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <div className="mb-1.5">
            <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />

          {/* Time */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
          </div>

          {/* Creator */}
          <div className="mt-2">
            <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Interest button area */}
        <div className="pt-5">
          <div className="h-8 w-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
