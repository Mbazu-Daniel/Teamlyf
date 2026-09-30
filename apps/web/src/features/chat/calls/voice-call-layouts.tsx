import { VideoTrack, type TrackReference } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { IconMicrophoneOff } from "@tabler/icons-react";
import { Avatar } from "./voice-call-avatar";
import { ParticipantTile } from "./voice-call-participant-tile";

export function VoiceCallHuddleLayout({
  allParticipants,
  localIdentity,
  localName,
  isMicrophoneEnabled,
}: {
  allParticipants: Participant[];
  localIdentity: string;
  localName?: string | null;
  isMicrophoneEnabled: boolean;
}) {
  return (
    <div
      className={`grid gap-4 sm:gap-6 w-full max-w-2xl px-6 sm:px-8 ${
        allParticipants.length === 1
          ? "grid-cols-1"
          : allParticipants.length <= 2
            ? "grid-cols-2"
            : allParticipants.length <= 4
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
      }`}
    >
      {allParticipants.map((p, i) => {
        const isLocal = p.identity === localIdentity;
        const muted = isLocal ? !isMicrophoneEnabled : !p.isMicrophoneEnabled;
        return (
          <div key={p.identity} className="flex flex-col items-center gap-3">
            <Avatar
              name={isLocal ? localName || "You" : p.name}
              colorIndex={i}
              size="lg"
              isSpeaking={p.isSpeaking}
              isMuted={muted}
            />
            <div className="text-center">
              <p className="text-sm font-semibold">{isLocal ? "You" : p.name || p.identity}</p>
              {p.isSpeaking && (
                <p className="text-caption-xs text-emerald-400 font-medium">Speaking…</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VoiceCallOneOnOneLayout({
  remotes,
  remoteCamTracks,
  localCam,
  localName,
  isCameraEnabled,
  isMicrophoneEnabled,
  controlsVisible,
}: {
  remotes: Participant[];
  remoteCamTracks: { participant: Participant; trackRef: TrackReference }[];
  localCam?: TrackReference;
  localName?: string | null;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  controlsVisible: boolean;
}) {
  return (
    <div className="absolute inset-0">
      {/* Remote full-screen */}
      {remoteCamTracks[0] ? (
        <VideoTrack
          trackRef={remoteCamTracks[0].trackRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          <Avatar
            name={remotes[0]?.name}
            colorIndex={1}
            size="lg"
            isSpeaking={remotes[0]?.isSpeaking ?? false}
          />
          <p className="text-lg font-semibold text-white">
            {remotes[0]?.name || "Waiting for participant…"}
          </p>
          {remotes[0] && <p className="text-sm text-white/40">Camera is off</p>}
        </div>
      )}

      {/* Remote name badge */}
      {remotes[0] && (
        <div
          className={`absolute bottom-24 left-5 z-20 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur border border-white/10 flex items-center gap-2">
            <span className="text-sm text-white font-medium">
              {remotes[0].name || "Participant"}
            </span>
            {!remotes[0].isMicrophoneEnabled && (
              <IconMicrophoneOff size={12} className="text-red-400" />
            )}
            {remotes[0].isSpeaking && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      )}

      {/* Local PiP */}
      <div
        className={`absolute top-16 sm:top-20 right-4 sm:right-5 z-30 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/15 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ width: "clamp(100px, 25vw, 200px)", aspectRatio: "16/10" }}
      >
        {isCameraEnabled && localCam ? (
          <VideoTrack trackRef={localCam} className="h-full w-full object-cover scale-x-[-1]" />
        ) : (
          <div className="h-full w-full bg-slate-900 flex items-center justify-center">
            <Avatar name={localName} colorIndex={0} size="sm" />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-7 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-1 left-1.5 text-[10px] text-white/80 font-medium">
          You
        </span>
        {!isMicrophoneEnabled && (
          <div className="absolute top-1 left-1 p-1 rounded-full bg-red-500">
            <IconMicrophoneOff size={9} />
          </div>
        )}
      </div>
    </div>
  );
}

export function VoiceCallConferenceLayout({
  allParticipants,
  localIdentity,
  localName,
  isMicrophoneEnabled,
  cameraTrack,
}: {
  allParticipants: Participant[];
  localIdentity: string;
  localName?: string | null;
  isMicrophoneEnabled: boolean;
  cameraTrack: (identity: string) => TrackReference | undefined;
}) {
  return (
    <div
      className={`grid gap-3 w-full h-full p-4 ${
        allParticipants.length <= 4
          ? "grid-cols-2"
          : allParticipants.length <= 6
            ? "grid-cols-3"
            : "grid-cols-4"
      }`}
    >
      {allParticipants.map((p, i) => {
        const isLocal = p.identity === localIdentity;
        const cam = cameraTrack(p.identity);
        return (
          <ParticipantTile
            key={p.identity}
            trackRef={cam}
            name={isLocal ? localName || "You" : p.name}
            colorIndex={i}
            isSpeaking={p.isSpeaking}
            isMuted={isLocal ? !isMicrophoneEnabled : !p.isMicrophoneEnabled}
            isLocal={isLocal}
            mirrored={isLocal}
          />
        );
      })}
    </div>
  );
}
