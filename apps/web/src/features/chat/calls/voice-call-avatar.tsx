import { IconMicrophoneOff } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { AVATAR_COLORS } from "./voice-call-constants";

export function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-white/50 text-xs tabular-nums">
      {h > 0 ? `${pad(h)}:` : ""}
      {pad(m)}:{pad(s)}
    </span>
  );
}

function SpeakingRipple() {
  return (
    <span className="absolute inset-0 rounded-full pointer-events-none">
      <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
      <span className="absolute inset-[-6px] rounded-full animate-ping bg-emerald-400/15 [animation-delay:150ms]" />
    </span>
  );
}

export function Avatar({
  name,
  colorIndex,
  size = "md",
  isSpeaking = false,
  isMuted = false,
}: {
  name?: string | null;
  colorIndex: number;
  size?: "sm" | "md" | "lg";
  isSpeaking?: boolean;
  isMuted?: boolean;
}) {
  const dims =
    size === "lg"
      ? "w-28 h-28 text-4xl"
      : size === "md"
        ? "w-20 h-20 text-2xl"
        : "w-12 h-12 text-lg";
  const ring = isSpeaking ? "ring-emerald-400/60" : "ring-white/8";
  return (
    <div className="relative flex items-center justify-center">
      {isSpeaking && <SpeakingRipple />}
      <div
        className={`relative ${dims} rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} flex items-center justify-center font-bold shadow-2xl ring-4 ${ring} transition-all duration-300`}
      >
        {name?.[0]?.toUpperCase() || "?"}
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-[#0a0f1d]">
            <IconMicrophoneOff size={10} />
          </div>
        )}
      </div>
    </div>
  );
}
