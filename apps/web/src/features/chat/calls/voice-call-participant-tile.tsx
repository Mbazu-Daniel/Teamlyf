import { VideoTrack, type TrackReference } from "@livekit/components-react";
import { IconMicrophoneOff } from "@tabler/icons-react";
import { Avatar } from "./voice-call-avatar";

export function ParticipantTile({
  trackRef,
  name,
  colorIndex,
  isSpeaking,
  isMuted,
  isLocal,
  mirrored = false,
}: {
  trackRef?: TrackReference;
  name?: string | null;
  colorIndex: number;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal?: boolean;
  mirrored?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#0d111f] flex items-center justify-center transition-all duration-300 ${
        isSpeaking
          ? "ring-2 ring-emerald-400/70 shadow-[0_0_24px_#34d39930]"
          : "ring-1 ring-white/5"
      }`}
    >
      {trackRef ? (
        <VideoTrack
          trackRef={trackRef}
          className={`absolute inset-0 w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <Avatar name={name} colorIndex={colorIndex} size="md" isSpeaking={isSpeaking} />
      )}
      {/* Name badge */}
      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-caption-xs font-semibold text-white/90 drop-shadow">
          {isLocal ? "You" : name || "Participant"}
        </span>
        {isMuted && <IconMicrophoneOff size={10} className="text-red-400" />}
        {isSpeaking && !isMuted && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}
