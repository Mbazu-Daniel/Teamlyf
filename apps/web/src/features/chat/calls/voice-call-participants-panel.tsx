import {
  IconHandStop,
  IconMicrophoneOff,
  IconUsers,
  IconVideoOff,
  IconX,
} from "@tabler/icons-react";
import type { Participant } from "livekit-client";

import { AVATAR_COLORS, parseMeta } from "./voice-call-constants";

export function VoiceCallParticipantsPanel({
  allParticipants,
  localIdentity,
  isMicrophoneEnabled,
  isCameraEnabled,
  onClose,
}: {
  allParticipants: Participant[];
  localIdentity: string;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="w-72 shrink-0 border-l border-white/6 flex flex-col bg-black/30 backdrop-blur-xl animate-in slide-in-from-right duration-300">
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <IconUsers size={14} className="text-indigo-400" />
          Participants
          <span className="ml-1 px-1.5 py-0.5 bg-indigo-600/30 text-indigo-300 rounded text-[10px] font-bold">
            {allParticipants.length}
          </span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
        >
          <IconX size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {allParticipants.map((p, i) => {
          const isLocal = p.identity === localIdentity;
          const meta = parseMeta(p.metadata);
          const muted = isLocal ? !isMicrophoneEnabled : !p.isMicrophoneEnabled;
          const camOff = isLocal ? !isCameraEnabled : !p.isCameraEnabled;
          return (
            <div
              key={p.identity}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold shrink-0 ${p.isSpeaking ? "ring-2 ring-emerald-400/60" : ""}`}
                >
                  {p.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {isLocal ? "You" : p.name || p.identity}
                  </p>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">
                    {i === 0 ? "Host" : "Member"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {p.isSpeaking && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {muted && <IconMicrophoneOff size={12} className="text-red-400" />}
                {camOff && <IconVideoOff size={12} className="text-white/25" />}
                {meta.isHandRaised ? <IconHandStop size={12} className="text-amber-400" /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VoiceCallHandRaiseToasts({ remotes }: { remotes: Participant[] }) {
  return (
    <div className="absolute top-20 right-5 flex flex-col gap-2 pointer-events-none z-50">
      {remotes.map((p) => {
        const meta = parseMeta(p.metadata);
        if (!meta.isHandRaised) return null;
        return (
          <div
            key={p.identity}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/90 backdrop-blur text-black shadow-2xl animate-in slide-in-from-right duration-400"
          >
            <div className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center">
              <IconHandStop size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider opacity-60">
                IconHandStop raised
              </p>
              <p className="text-sm font-bold leading-tight">{p.name || p.identity}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
