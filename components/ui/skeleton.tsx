// ── Skeleton base ──────────────────────────────────────────────────────
// A single reusable shimmer block. Compose these to match your real layout.

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent ${className}`}
    />
  );
}

// ── Dashboard skeleton ─────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Todos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <div className="flex items-end gap-3 h-[220px] pt-4">
            {[40, 65, 45, 80, 55, 90].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <Skeleton className="h-5 w-32 rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    </div>
  );
}

// ── List page skeleton (Leads / Projects / Goals) ─────────────────────
export function CardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-4 w-52 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-2">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3.5 w-20 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Finance skeleton ───────────────────────────────────────────────────
export function FinanceSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-4 w-52 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="xl:col-span-2 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="flex items-end gap-4 h-[280px] pt-4">
          {[55, 70, 45, 85, 60, 90, 40, 75].map((h, i) => (
            <div key={i} className="flex-1 flex gap-1 items-end h-full">
              <Skeleton className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
              <Skeleton className="flex-1 rounded-t-md" style={{ height: `${h * 0.6}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Project rows */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-44 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview skeleton ──────────────────────────────────────────────────
export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      {/* Tab row */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-xl" />
        ))}
      </div>
      {/* Items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center gap-4">
            <Skeleton className="w-5 h-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Todo skeleton ──────────────────────────────────────────────────────
export function TodoSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      {/* Progress banner */}
      <Skeleton className="h-28 w-full rounded-2xl" />
      {/* Todo items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
