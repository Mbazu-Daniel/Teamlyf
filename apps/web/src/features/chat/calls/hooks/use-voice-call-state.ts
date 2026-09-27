import {
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
  type TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useCallback, useState } from "react";
import { useControlsVisibility } from "./use-controls-visibility";
import type { LayoutMode } from "../voice-call-constants";

export function useVoiceCallState() {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();

  const participants = useParticipants();
  const remotes = participants.filter(
    (p) => p.identity !== localParticipant.identity
  );
  const allParticipants = [localParticipant, ...remotes];

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const controlsVisible = useControlsVisibility();

  // ── Track subscriptions ──────────────────────────────────────────────────
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);

  // Type-guard: only published, non-muted tracks
  const isRealTrack = (t: (typeof tracks)[number]): t is TrackReference =>
    t.publication !== undefined && !t.publication.isMuted;

  const cameraTrack = (identity: string) =>
    tracks.find(
      (t) => t.participant.identity === identity && t.source === Track.Source.Camera && isRealTrack(t)
    ) as TrackReference | undefined;

  const screenTrack = (identity: string) =>
    tracks.find(
      (t) => t.participant.identity === identity && t.source === Track.Source.ScreenShare && isRealTrack(t)
    ) as TrackReference | undefined;

  // ── Derived state ────────────────────────────────────────────────────────
  const localCam = cameraTrack(localParticipant.identity);
  // const localScreen = screenTrack(localParticipant.identity);

  // Handle multiple screen shares
  const activeScreenShares = allParticipants
    .map((p) => ({ participant: p, trackRef: screenTrack(p.identity) }))
    .filter((x): x is { participant: typeof allParticipants[0]; trackRef: TrackReference } => !!x.trackRef);

  // Remote camera tracks — only include participants whose camera is genuinely on.
  // Guard on both the track publication AND p.isCameraEnabled so that a muted-but-not-
  // yet-removed track never causes a black VideoTrack to render.
  const remoteCamTracks = remotes
    .map((p) => ({ participant: p, trackRef: cameraTrack(p.identity) }))
    .filter(
      (x): x is { participant: typeof remotes[number]; trackRef: TrackReference } =>
        !!x.trackRef && x.participant.isCameraEnabled
    );

  // Drive anyVideoActive from participant state, not just track presence.
  // This ensures the layout switches back to huddle the moment a camera is disabled,
  // even if LiveKit hasn't fully removed the track object yet.
  const anyVideoActive = isCameraEnabled || remotes.some((p) => p.isCameraEnabled);

  // ── Layout mode ──────────────────────────────────────────────────────────
  const layoutMode: LayoutMode = (() => {
    if (activeScreenShares.length > 0) return "presentation";
    if (!anyVideoActive) return "huddle";
    if (allParticipants.length <= 2) return "one-on-one";
    return "conference";
  })();

  // ── Hand-raise ───────────────────────────────────────────────────────────
  const toggleHandRaise = useCallback(async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    try {
      const meta = JSON.parse(localParticipant.metadata || "{}");
      await room.localParticipant.setMetadata(
        JSON.stringify({ ...meta, isHandRaised: next })
      );
    } catch {/* ignore */ }
  }, [isHandRaised, setIsHandRaised, localParticipant.metadata, room.localParticipant]);

  return {
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
  };
}
