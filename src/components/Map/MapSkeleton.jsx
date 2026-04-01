export default function MapSkeleton() {
  // Fake pin positions (percentage-based) for the skeleton
  const pins = [
    { left: '30%', top: '35%', delay: '0s' },
    { left: '55%', top: '25%', delay: '0.15s' },
    { left: '45%', top: '55%', delay: '0.3s' },
    { left: '65%', top: '45%', delay: '0.45s' },
    { left: '25%', top: '60%', delay: '0.6s' },
  ]

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none">
      {pins.map((pin, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{ left: pin.left, top: pin.top, animationDelay: pin.delay }}
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200/70 border-2 border-white shadow-sm" />
            <div
              className="w-0 h-0 -mt-0.5"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '7px solid rgb(229 231 235 / 0.7)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
