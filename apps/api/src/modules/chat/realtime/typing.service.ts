import { Injectable } from "@nestjs/common";

/** A typing flag expires if the client never sends `typing-stop`. */
const TYPING_TTL_MS = 5000;

/**
 * Room typing state for `user-typing` broadcasts. Kept in this module (not in
 * `ChatPresenceService`) so one module owns the socket concern end to end.
 */
@Injectable()
export class ChatTypingService {
  private readonly expiryByRoom = new Map<string, Map<string, number>>();
  private readonly roomsByMember = new Map<string, Set<string>>();

  set(room: string, memberId: string): void {
    const now = Date.now();
    let members = this.expiryByRoom.get(room);
    if (!members) {
      members = new Map();
      this.expiryByRoom.set(room, members);
    }
    members.set(memberId, now + TYPING_TTL_MS);

    let rooms = this.roomsByMember.get(memberId);
    if (!rooms) {
      rooms = new Set();
      this.roomsByMember.set(memberId, rooms);
    }
    rooms.add(room);
  }

  stop(room: string, memberId: string): void {
    const members = this.expiryByRoom.get(room);
    if (members) {
      members.delete(memberId);
      if (members.size === 0) this.expiryByRoom.delete(room);
    }
    const stillTyping = [...(this.roomsByMember.get(memberId) ?? [])].filter((known) => known !== room);
    if (stillTyping.length === 0) this.roomsByMember.delete(memberId);
    else this.roomsByMember.set(memberId, new Set(stillTyping));
  }

  /** Drops every typing flag of a member that went fully offline. */
  clearMember(memberId: string): void {
    const rooms = this.roomsByMember.get(memberId);
    this.roomsByMember.delete(memberId);
    if (!rooms) return;
    for (const room of rooms) {
      const members = this.expiryByRoom.get(room);
      if (!members) continue;
      members.delete(memberId);
      if (members.size === 0) this.expiryByRoom.delete(room);
    }
  }

  /** Live typing member ids for one room, with expired flags swept away. */
  activeMemberIds(room: string): string[] {
    const members = this.expiryByRoom.get(room);
    if (!members) return [];
    const now = Date.now();
    for (const [memberId, expiry] of members) {
      if (expiry <= now) {
        members.delete(memberId);
        const rooms = this.roomsByMember.get(memberId);
        if (rooms) {
          rooms.delete(room);
          if (rooms.size === 0) this.roomsByMember.delete(memberId);
        }
      }
    }
    if (members.size === 0) {
      this.expiryByRoom.delete(room);
      return [];
    }
    return [...members.keys()];
  }
}
