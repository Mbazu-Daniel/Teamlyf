export function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/90">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

export function TypingDots() {
  return (
    <div className="flex items-center gap-[3px] px-0.5 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}
