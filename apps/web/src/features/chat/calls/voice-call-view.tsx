import { RoomAudioRenderer } from "@livekit/components-react";
import { useVoiceCallState } from "./hooks/use-voice-call-state";
import { VoiceCallControlBar } from "./voice-call-control-bar";
import { VoiceCallHeader } from "./voice-call-header";
import {
  VoiceCallConferenceLayout,
  VoiceCallHuddleLayout,
  VoiceCallOneOnOneLayout,
} from "./voice-call-layouts";
import {
  VoiceCallHandRaiseToasts,
  VoiceCallParticipantsPanel,
} from "./voice-call-participants-panel";
import { VoiceCallPresentationLayout } from "./voice-call-presentation-layout";

export function VoiceCallView({
  onLeave,
  onEnd,
  isInitiator,
}: {
  onLeave: () => void;
  onEnd: () => void;
  isInitiator: boolean;
}) {
  const {
    room,
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    remotes,
    allParticipants,
    isHandRaised,
    showParticipants,
    setShowParticipants,
    controlsVisible,
    cameraTrack,
    localCam,
    activeScreenShares,
    remoteCamTracks,
    layoutMode,
    toggleHandRaise,
  } = useVoiceCallState();

  return (
    <div
      className="flex h-full overflow-hidden text-white select-none"
      style={{ background: "linear-gradient(135deg,#08091a 0%,#0b0f22 60%,#08091a 100%)" }}
    >
      <RoomAudioRenderer />
      {/* ══ MAIN AREA ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <VoiceCallHeader
          layoutMode={layoutMode}
          controlsVisible={controlsVisible}
          allParticipants={allParticipants}
          showParticipants={showParticipants}
          onToggleParticipants={() => setShowParticipants((x) => !x)}
        />

        {/* ── Main content area ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {layoutMode === "presentation" && activeScreenShares.length > 0 && (
            <VoiceCallPresentationLayout
              activeScreenShares={activeScreenShares}
              allParticipants={allParticipants}
              localIdentity={localParticipant.identity}
              controlsVisible={controlsVisible}
              cameraTrack={cameraTrack}
            />
          )}

          {layoutMode === "huddle" && (
            <VoiceCallHuddleLayout
              allParticipants={allParticipants}
              localIdentity={localParticipant.identity}
              localName={localParticipant.name}
              isMicrophoneEnabled={isMicrophoneEnabled}
            />
          )}

          {layoutMode === "one-on-one" && (
            <VoiceCallOneOnOneLayout
              remotes={remotes}
              remoteCamTracks={remoteCamTracks}
              localCam={localCam}
              localName={localParticipant.name}
              isCameraEnabled={isCameraEnabled}
              isMicrophoneEnabled={isMicrophoneEnabled}
              controlsVisible={controlsVisible}
            />
          )}

          {layoutMode === "conference" && (
            <VoiceCallConferenceLayout
              allParticipants={allParticipants}
              localIdentity={localParticipant.identity}
              localName={localParticipant.name}
              isMicrophoneEnabled={isMicrophoneEnabled}
              cameraTrack={cameraTrack}
            />
          )}
        </div>

        <VoiceCallControlBar
          controlsVisible={controlsVisible}
          room={room}
          isMicrophoneEnabled={isMicrophoneEnabled}
          isCameraEnabled={isCameraEnabled}
          isScreenShareEnabled={isScreenShareEnabled}
          isHandRaised={isHandRaised}
          showParticipants={showParticipants}
          isInitiator={isInitiator}
          onToggleHandRaise={toggleHandRaise}
          onToggleParticipants={() => setShowParticipants((x) => !x)}
          onLeave={onLeave}
          onEnd={onEnd}
        />
      </div>

      {showParticipants && (
        <VoiceCallParticipantsPanel
          allParticipants={allParticipants}
          localIdentity={localParticipant.identity}
          isMicrophoneEnabled={isMicrophoneEnabled}
          isCameraEnabled={isCameraEnabled}
          onClose={() => setShowParticipants(false)}
        />
      )}

      <VoiceCallHandRaiseToasts remotes={remotes} />
    </div>
  );
}
