import { useEffect, useRef, useState } from "react";
import { useMediaRecorder } from "@/features/chat/data/hooks/use-media-recorder-hooks";
import { audioBlobToFile } from "../composer-utils";
import type { ComposerAttachment } from "../types";

type SetAttachments = React.Dispatch<React.SetStateAction<ComposerAttachment[]>>;

export function useComposerRecording(setAttachments: SetAttachments) {
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<number | null>(null);

  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onStart: () => {
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    },
    onStop: (blob) => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setAttachments((prev) => {
        const exists = prev.some((a) => a.file.type.startsWith("audio/"));
        if (exists) return prev;

        return [...prev, { file: audioBlobToFile(blob), status: "pending" }];
      });
    },
  });

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleMic = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return {
    isRecording,
    recordingTime,
    handleMic,
  };
}
