import { Injectable } from "@nestjs/common";

type SocketOwner = { organizationId: string; memberId: string };

/**
 * Chat presence held in this process. The source repo kept it in Redis; the
 * target runs a single API instance, so a pair of ref-counted maps gives the
 * same answers: a member is online while at least one of their sockets is
 * open, and two tabs keep them online until the last one closes.
 */
@Injectable()
export class ChatPresenceService {
  private readonly socketsByMember = new Map<string, Set<string>>();
  private readonly membersByOrganization = new Map<string, Set<string>>();
  private readonly ownerBySocket = new Map<string, SocketOwner>();

  connect(organizationId: string, memberId: string, socketId: string): boolean {
    const existing = this.socketsByMember.get(memberId);
    const becameOnline = existing === undefined || existing.size === 0;

    if (!existing) this.socketsByMember.set(memberId, new Set());
    this.socketsByMember.get(memberId)?.add(socketId);

    if (!this.membersByOrganization.has(organizationId)) {
      this.membersByOrganization.set(organizationId, new Set());
    }
    this.membersByOrganization.get(organizationId)?.add(memberId);

    this.ownerBySocket.set(socketId, { organizationId, memberId });
    return becameOnline;
  }

  /** Returns the owner that just left plus whether they went fully offline. */
  disconnect(socketId: string): (SocketOwner & { becameOffline: boolean }) | null {
    const owner = this.ownerBySocket.get(socketId);
    if (!owner) return null;

    this.ownerBySocket.delete(socketId);
    const sockets = this.socketsByMember.get(owner.memberId);
    sockets?.delete(socketId);
    const becameOffline = sockets ? sockets.size === 0 : true;
    if (becameOffline) {
      this.socketsByMember.delete(owner.memberId);
      this.membersByOrganization.get(owner.organizationId)?.delete(owner.memberId);
      if (this.membersByOrganization.get(owner.organizationId)?.size === 0) {
        this.membersByOrganization.delete(owner.organizationId);
      }
    }

    return { ...owner, becameOffline };
  }

  isOnline(memberId: string): boolean {
    return (this.socketsByMember.get(memberId)?.size ?? 0) > 0;
  }

  /** Member ids with at least one open socket in this organization. */
  onlineMemberIds(organizationId: string): ReadonlySet<string> {
    return this.membersByOrganization.get(organizationId) ?? new Set<string>();
  }

  /** Presence flags for one page of members, one lookup per id. */
  presenceFor(memberIds: readonly string[]): Map<string, boolean> {
    return new Map(memberIds.map((id) => [id, this.isOnline(id)]));
  }
}
