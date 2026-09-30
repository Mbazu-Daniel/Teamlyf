import {
  IconDeviceDesktop,
  IconDeviceDesktopOff,
  IconHandStop,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconUsers,
  IconVideoOff,
  IconVideoPlus,
} from "@tabler/icons-react";
import type { Room } from "livekit-client";

import { ControlBtn } from "./voice-call-control-btn";

export function VoiceCallControlBar({
  controlsVisible,
  room,
  isMicrophoneEnabled,
  isCameraEnabled,
  isScreenShareEnabled,
  isHandRaised,
  showParticipants,
  isInitiator,
  onToggleHandRaise,
  onToggleParticipants,
  onLeave,
  onEnd,
}: {
  controlsVisible: boolean;
  room: Room;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled: boolean;
  isHandRaised: boolean;
  showParticipants: boolean;
  isInitiator: boolean;
  onToggleHandRaise: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  onEnd: () => void;
}) {
  return (
    <div
      className={`absolute bottom-0 inset-x-0 z-30 transition-all duration-500 ${controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
    >
      <div className="px-3 sm:px-6 pt-10 pb-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-[40px] bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl max-w-full overflow-x-auto no-scrollbar">
          {/* Mic */}
          <ControlBtn
            onClick={() => room.localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            label={isMicrophoneEnabled ? "Mute" : "Unmute"}
            variant={isMicrophoneEnabled ? "default" : "danger"}
          >
            {isMicrophoneEnabled ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </ControlBtn>

          {/* Camera */}
          <ControlBtn
            onClick={() => room.localParticipant.setCameraEnabled(!isCameraEnabled)}
            label={isCameraEnabled ? "Stop camera" : "Start camera"}
            variant={isCameraEnabled ? "highlight" : "default"}
          >
            {isCameraEnabled ? <IconVideoPlus size={20} /> : <IconVideoOff size={20} />}
          </ControlBtn>

          {/* Screen share */}
          <ControlBtn
            onClick={() => room.localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            label={isScreenShareEnabled ? "Stop sharing" : "Share screen"}
            variant={isScreenShareEnabled ? "highlight" : "default"}
          >
            {isScreenShareEnabled ? (
              <IconDeviceDesktopOff size={20} className="text-green-300" />
            ) : (
              <IconDeviceDesktop size={20} />
            )}
          </ControlBtn>

          {/* Raise hand */}
          <ControlBtn
            onClick={onToggleHandRaise}
            label={isHandRaised ? "Lower hand" : "Raise hand"}
            variant={isHandRaised ? "highlight" : "default"}
          >
            <IconHandStop size={20} className={isHandRaised ? "text-amber-300" : ""} />
          </ControlBtn>

          {/* Participants */}
          <ControlBtn
            onClick={onToggleParticipants}
            label="Participants"
            variant={showParticipants ? "highlight" : "default"}
          >
            <IconUsers size={20} />
          </ControlBtn>

          <div className="w-px h-8 bg-white/12 mx-1" />

          {/* Leave — disconnects self only */}
          <ControlBtn
            onClick={() => {
              room.disconnect();
              onLeave();
            }}
            label="Leave call"
            variant="end"
          >
            <IconPhoneOff size={18} />
            <span className="text-xs sm:text-sm font-semibold truncate max-w-[60px] sm:max-w-none">
              Leave
            </span>
          </ControlBtn>

          {/* End for everyone — only the initiator sees this */}
          {isInitiator && (
            <ControlBtn
              onClick={() => {
                room.disconnect();
                onEnd();
              }}
              label="End for everyone"
              variant="end"
            >
              <span className="text-xs sm:text-sm font-semibold px-1 truncate max-w-[70px] sm:max-w-none">
                End for all
              </span>
            </ControlBtn>
          )}
        </div>
      </div>
    </div>
  );
}
