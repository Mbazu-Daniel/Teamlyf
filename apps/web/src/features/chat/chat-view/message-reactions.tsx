import { cn } from "@/lib/utils";
import { useTenantStore } from "@/lib/store/tenant-store";
import { Message } from "@/features/chat/types/messages/types";
import { useMessageReactions } from "@/features/chat/data/queries/use-fetch-message-reactions-hook";

export function MessageReactionsRenderer({
  msg,
  type,
  chatId,
  currentMemberId,
  onAddReaction,
  onRemoveReaction,
}: {
  msg: Message;
  type: "channel" | "direct";
  chatId: string;
  currentMemberId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}) {
  const tenantId = useTenantStore((s) => s.tenantId);

  const { data: dbReactions } = useMessageReactions(tenantId!, chatId, msg.id, type);

  const combinedReactions = msg.reactions !== undefined ? msg.reactions : dbReactions || [];

  if (!combinedReactions || combinedReactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5 relative z-10" onClick={(e) => e.stopPropagation()}>
      {Object.entries(
        combinedReactions.reduce(
          (acc, r) => {
            acc[r.reaction] = acc[r.reaction] || [];
            if (!acc[r.reaction].includes(r.tenantMemberId)) {
              acc[r.reaction].push(r.tenantMemberId);
            }
            return acc;
          },
          {} as Record<string, string[]>,
        ),
      ).map(([emoji, memberIds]) => {
        const hasReacted = currentMemberId ? memberIds.includes(currentMemberId) : false;
        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              if (hasReacted) {
                onRemoveReaction?.(msg.id, emoji);
              } else {
                onAddReaction?.(msg.id, emoji);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-caption-xs font-medium border transition-colors",
              hasReacted
                ? "bg-primary-button/10 border-primary-button/30 text-primary-button"
                : "bg-primary-button/10 border-primary-button/30 text-primary-button hover:bg-primary-button/20",
            )}
          >
            <span>{emoji}</span>
            <span className="opacity-80 font-semibold">{memberIds.length}</span>
          </button>
        );
      })}
    </div>
  );
}
