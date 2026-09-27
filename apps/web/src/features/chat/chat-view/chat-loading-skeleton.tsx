export function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 h-14 shrink-0">
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              <div className="h-3 w-64 rounded bg-muted animate-pulse" />
              {i % 3 === 0 && <div className="h-3 w-44 rounded bg-muted animate-pulse" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
