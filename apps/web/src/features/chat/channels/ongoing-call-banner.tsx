import { IconHash } from "@tabler/icons-react";

export function OngoingCallBanner({
  type,
  onJoin,
  onDecline,
}: {
  type: string;
  onJoin: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-blue-50/50 border-t border-b border-blue-100/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 animate-pulse">
          <IconHash size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-900">Ongoing {type} call</p>
          <p className="text-xs text-blue-700/70 font-medium">Click join to enter the room</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDecline}
          className="px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100/50 rounded-xl transition-colors"
        >
          Dismiss
        </button>
        <button
          onClick={onJoin}
          className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          Join Call
        </button>
      </div>
    </div>
  );
}
