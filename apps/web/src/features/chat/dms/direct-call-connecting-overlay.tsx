import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";

type DirectCallConnectingOverlayProps = {
  conversation?: DirectMessagePreview;
  onCancel: () => void;
};

export function DirectCallConnectingOverlay({
  conversation,
  onCancel,
}: DirectCallConnectingOverlayProps) {
  return (
    <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 text-white">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={conversation?.otherMember?.avatar || undefined}
                alt={conversation?.otherMember?.firstName}
              />
              <AvatarFallback bg="primary-button" tone="white" weight="bold" size="xl">
                {conversation?.otherMember.firstName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">
            Calling {conversation?.otherMember?.firstName}...
          </p>
          <p className="text-sm text-gray-300">Waiting for answer</p>
        </div>
        <button
          onClick={onCancel}
          className="mt-4 px-6 py-2 bg-red-500 rounded-full font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
