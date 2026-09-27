import type { Participant } from "livekit-client";
import { CallTimer } from "./voice-call-avatar";
import { AVATAR_COLORS, type LayoutMode } from "./voice-call-constants";
import { IconUsers } from "@tabler/icons-react";

export function VoiceCallHeader({
  layoutMode,
  controlsVisible,
  allParticipants,
  showParticipants,
  onToggleParticipants,
}: {
  layoutMode: LayoutMode;
  controlsVisible: boolean;
  allParticipants: Participant[];
  showParticipants: boolean;
  onToggleParticipants: () => void;
}) {
  return (
    <div
      className={`absolute top-0 inset-x-0 z-30 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-8 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-caption-xs font-bold text-emerald-300 uppercase tracking-widest px-0.5">
              {layoutMode === "presentation"
                ? "Presenting"
                : layoutMode === "conference"
                  ? "Conference"
                  : layoutMode === "one-on-one"
                    ? "Video"
                    : "Voice"}
            </span>
          </div>
          <CallTimer />
        </div>

        {/* Participant avatars + panel toggle */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-1">
            {allParticipants.slice(0, 4).map((p, i) => (
              <div
                key={p.identity}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} border-2 border-[#08091a] flex items-center justify-center text-[10px] font-bold`}
              >
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {allParticipants.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-white/12 border-2 border-[#08091a] flex items-center justify-center text-[10px] font-bold">
                +{allParticipants.length - 4}
              </div>
            )}
          </div>
          <button
            onClick={onToggleParticipants}
            className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-sm ${showParticipants ? "bg-indigo-600 text-white" : "bg-white/8 hover:bg-white/14 text-white/70"}`}
          >
            <IconUsers size={15} />
            <span className="text-xs font-medium">{allParticipants.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
