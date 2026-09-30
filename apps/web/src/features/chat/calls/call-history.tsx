import { PageEmptyState } from "@/components/workspace/page-layout";
import { IconClock, IconPhone, IconPhoneCall, IconVideoPlus } from "@tabler/icons-react";
import { useState } from "react";

import {
  useFetchCallHistory,
  useFetchMissedCalls,
} from "@/features/chat/data/queries/use-fetch-call-history-hook";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useCallStore } from "@/lib/store/ui-stores";
import { TenantMemberAvatar } from "@/components/tenant-members/tenant-member-avatar";
import { getMemberDisplayName } from "@/lib/tenant-members/member-display";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CallHistoryRecord, JoinCallResponse } from "@/features/chat/types/call/types";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

import { getAvatarColor } from "@/lib/utils/avatar-colors";

export function CallHistory() {
  const [activeTab, setActiveTab] = useState<"all" | "missed">("all");

  const { tenantId } = useTenantStore();
  const { accessToken, user } = useAuthStore();
  const { isCallActive } = useCallStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: members } = useFetchTenantMembers(tenantId!);
  const myMemberId = members?.records?.find(
    (m: TenantMember) => String(m.userId) === String(user?.id),
  )?.id;

  const { data: allCalls = [], isLoading: isLoadingAll } = useFetchCallHistory(tenantId!);
  const { data: missedCalls = [], isLoading: isLoadingMissed } = useFetchMissedCalls(tenantId!);

  const isLoading = activeTab === "all" ? isLoadingAll : isLoadingMissed;
  const calls = activeTab === "all" ? allCalls : missedCalls;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleInitiateCall = (targetMemberId: string, type: "voice" | "video") => {
    if (isConnecting || isCallActive) return;

    setIsConnecting(true);
    const socket = getSocket(accessToken!, tenantId!);

    socket.emit(
      "initiate-call",
      { recipientId: targetMemberId, callType: type },
      (res: JoinCallResponse) => {
        if (res.callSession) {
          toast.info(`Calling ${targetMemberId}...`);
        } else {
          setIsConnecting(false);
          toast.error("Could not establish call.");
        }
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Header */}
      <div className="border-b border-border/70 bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-button/10 rounded-xl flex items-center justify-center">
              <IconPhone className="w-5 h-5 text-primary-button" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Calls</h2>
              <p className="text-xs text-muted-foreground">View your recent call activity</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="ml-auto flex h-control items-center gap-1 rounded-[12px] bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "inline-flex h-control-inner items-center rounded-[9px] px-4 text-[13px] font-medium transition-colors",
                activeTab === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("missed")}
              className={cn(
                "inline-flex h-control-inner items-center rounded-[9px] px-4 text-[13px] font-medium transition-colors",
                activeTab === "missed"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Missed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border/30">
                <Skeleton variant="full" className="h-10 w-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rounded" className="h-4 w-32" />
                  <Skeleton variant="rounded" className="h-3 w-20" />
                </div>
                <Skeleton variant="lg" className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="p-4 sm:p-6">
            <PageEmptyState
              icon={IconPhone}
              title="No calls found"
              description={
                activeTab === "all"
                  ? "Your voice and video call history will appear here."
                  : "You have no missed calls to catch up on."
              }
            />
          </div>
        ) : (
          <div className="divide-y-2 divide-border/50">
            {calls.map((call: CallHistoryRecord) => {
              const isIInitiator = call.initiatorId === myMemberId;
              const otherParty = isIInitiator ? call.recipient : call.initiator;

              const displayName = otherParty
                ? getMemberDisplayName({
                    ...otherParty,
                    avatar: otherParty.photoUrl,
                  })
                : call.channel
                  ? "Channel Call"
                  : "Unknown";

              const displayMember = otherParty
                ? { ...otherParty, avatar: otherParty.photoUrl }
                : null;

              return (
                <div key={call.id} className="px-6 py-4 hover:bg-card/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    {/* Call Icon & Avatar */}
                    <div className="relative">
                      {call.channel ? (
                        <Avatar border="subtle" className="h-10 w-10">
                          <AvatarFallback
                            tone="white"
                            weight="bold"
                            className="flex items-center justify-center"
                            style={{ backgroundColor: getAvatarColor(call.channel.id) }}
                          >
                            #
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <TenantMemberAvatar
                          member={displayMember}
                          border="subtle"
                          className="h-10 w-10"
                          colorId={otherParty?.id || call.id}
                        />
                      )}
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center shadow-sm",
                          call.status === "active" ? "bg-green-500" : "bg-muted/60",
                        )}
                      >
                        {call.callType === "video" ? (
                          <IconVideoPlus className="w-2.5 h-2.5  text-white" />
                        ) : (
                          <IconPhone className="w-2.5 h-2.5  text-white" />
                        )}
                      </div>
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        {call.channel && (
                          <span className="text-[10px] px-2 py-0.5 bg-primary-button/10 text-primary-button rounded-full font-bold">
                            #{call.channel.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IconClock className="w-3 h-3" />
                          <span className="text-xs">{formatDate(call.startedAt)}</span>
                        </div>
                        {call.duration && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-xs">{formatDuration(call.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {otherParty && (
                        <Button
                          variant="outline-primary"
                          size="xs"
                          onClick={() => handleInitiateCall(otherParty.id, call.callType)}
                          disabled={isConnecting || isCallActive}
                        >
                          <IconPhoneCall className="w-3.5 h-3.5" />
                          {isConnecting ? "Connecting..." : "Call back"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
