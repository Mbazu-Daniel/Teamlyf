import {
  LiveKitRoom,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VoiceCall } from './voice-call';

type CallType = 'voice' | 'video' | 'CONFERENCE';

interface CallProps {
  token: string;
  roomName: string;
  callType: CallType;
  onLeave: () => void;
  onEnd: () => void;
  isInitiator: boolean;
}

export const CallRoom = ({
  token,
  callType,
  onLeave,
  onEnd,
  isInitiator,
}: CallProps) => {
  return (
    <LiveKitRoom
      video={callType !== 'voice'}
      audio={true}
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      onDisconnected={onLeave}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <VoiceCall onLeave={onLeave} onEnd={onEnd} isInitiator={isInitiator} />
    </LiveKitRoom>
  );
};
