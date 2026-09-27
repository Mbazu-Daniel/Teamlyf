import { VideoTrack, type TrackReference } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { Avatar } from "./voice-call-avatar";

export function VoiceCallPresentationLayout({
  activeScreenShares,
  allParticipants,
  localIdentity,
  controlsVisible,
  cameraTrack,
}: {
  activeScreenShares: { participant: Participant; trackRef: TrackReference }[];
  allParticipants: Participant[];
  localIdentity: string;
  controlsVisible: boolean;
  cameraTrack: (identity: string) => TrackReference | undefined;
}) {
  return (
    <div className="flex flex-col w-full h-full">
      {/* Presenter label - Softened and repositioned */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-caption-xs text-white/60 shadow-2xl transition-all duration-500 group-hover:top-20">
        {activeScreenShares.length === 1 ? (
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white/90">
              {activeScreenShares[0].participant.identity === localIdentity
                ? "You are"
                : (activeScreenShares[0].participant.name || "Someone") + " is"}{" "}
              presenting
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-medium text-white/90">
              {activeScreenShares.length} people are presenting
            </span>
          </div>
        )}
      </div>

      {/* Screen share area - Using transparent bg to show main gradient and adding subtle shadow */}
      <div
        className={`flex-1 relative overflow-hidden grid gap-4 p-4 ${activeScreenShares.length > 1
          ? activeScreenShares.length <= 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
          : "grid-cols-1"
          }`}
      >
        {activeScreenShares.map((share) => (
          <div key={share.participant.identity} className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 bg-black/20">
            <VideoTrack
              trackRef={share.trackRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-semibold text-white/80 border border-white/10 shadow-lg">
              {share.participant.identity === localIdentity
                ? "Your Screen"
                : (share.participant.name || "Participant") + "'s Screen"}
            </div>
          </div>
        ))}
      </div>

      {/* People strip at the bottom */}
      <div
        className={`shrink-0 flex gap-2 px-4 py-2 overflow-x-auto bg-black/40 backdrop-blur border-t border-white/5 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
      >
        {allParticipants.map((p, i) => {
          const isLocal = p.identity === localIdentity;
          const cam = cameraTrack(p.identity);
          const trackRef = cam;
          return (
            <div key={p.identity} className="shrink-0 w-28 h-20 rounded-xl overflow-hidden relative bg-[#0d111f] ring-1 ring-white/8">
              {trackRef ? (
                <VideoTrack
                  trackRef={trackRef}
                  className={`absolute inset-0 w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar name={p.name} colorIndex={i} size="sm" isSpeaking={p.isSpeaking} />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-1 left-1.5 text-[9px] text-white/75 font-medium truncate max-w-[80px]">
                {isLocal ? "You" : (p.name || p.identity)}
              </span>
              {p.isSpeaking && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
