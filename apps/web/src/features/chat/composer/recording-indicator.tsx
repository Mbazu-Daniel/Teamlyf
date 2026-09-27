import { formatRecordingTime } from "./composer-utils";

type RecordingIndicatorProps = {
  recordingTime: number;
};

export function RecordingIndicator({ recordingTime }: RecordingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mx-3 mb-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-100">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-xs font-semibold text-red-600">
        Recording — {formatRecordingTime(recordingTime)}
      </span>
      <span className="ml-auto text-[10px] text-red-400">Enter to stop</span>
    </div>
  );
}
