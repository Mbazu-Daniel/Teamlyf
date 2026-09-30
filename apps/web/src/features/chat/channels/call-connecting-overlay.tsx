import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel } from "@/features/chat/types/channel/types";

type CallConnectingOverlayProps = {
  channel?: Channel;
  onCancel: () => void;
};

export function CallConnectingOverlay({ channel, onCancel }: CallConnectingOverlayProps) {
  return (
    <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 text-white">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src={channel?.avatar} alt={channel?.name} />
              <AvatarFallback bg="primary-button" tone="white" weight="bold" size="xl">
                {channel?.name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">Connecting to {channel?.name}...</p>
          <p className="text-sm text-gray-300">Setting up your session</p>
        </div>
        <button onClick={onCancel} className="mt-4 px-6 py-2 bg-red-50 rounded-full font-semibold">
          Cancel
        </button>
      </div>
    </div>
  );
}
