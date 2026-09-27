export function ControlBtn({
  children,
  onClick,
  label,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  variant?: "default" | "danger" | "active" | "highlight" | "end";
}) {
  const styles = {
    default: "bg-white/10 hover:bg-white/18 text-white",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30",
    active: "bg-white/10 hover:bg-white/18 text-white",
    highlight: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    end: "bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 px-5 gap-2",
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-11 sm:h-12 min-w-[2.5rem] sm:min-w-[3rem] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
