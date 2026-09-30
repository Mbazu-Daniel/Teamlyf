import { useEffect, useRef } from "react";

export function useCallSounds(isRinging: boolean, isConnecting: boolean) {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const outgoingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    ringtoneRef.current = new Audio("/sounds/incoming-ring.mp3");
    outgoingRef.current = new Audio("/sounds/outgoing-ring.mp3");

    if (ringtoneRef.current) ringtoneRef.current.loop = true;
    if (outgoingRef.current) outgoingRef.current.loop = true;

    const unlockAudio = () => {
      if (ringtoneRef.current) {
        ringtoneRef.current
          .play()
          .then(() => {
            ringtoneRef.current?.pause();
            if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
          })
          .catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      ringtoneRef.current?.pause();
      outgoingRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const playSound = async (audio: HTMLAudioElement | null) => {
      try {
        if (audio) await audio.play();
      } catch {
        if (import.meta.env.DEV) {
          console.warn("Audio still blocked. User needs to click the page first.");
        }
      }
    };

    if (isRinging) {
      playSound(ringtoneRef.current);
    } else {
      ringtoneRef.current?.pause();
    }

    if (isConnecting) {
      playSound(outgoingRef.current);
    } else {
      outgoingRef.current?.pause();
    }
  }, [isRinging, isConnecting]);
}
