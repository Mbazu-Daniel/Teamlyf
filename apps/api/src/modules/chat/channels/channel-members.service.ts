import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { channelMember } from "@teamlyf/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { loadChatMemberSources, type ChatMemberSource } from "../shared/member.mapper";
import {
  requireChannelMembership,
  requireChannelRow,
  type ChannelMembershipRow,
} from "./channel-access";
import {
  toChannelMemberDto,
  toChannelMembershipDto,
  type ChannelMemberDto,
  type ChannelMembershipDto,
} from "./channel.mapper";

type MemberRowWithSource = { row: ChannelMembershipRow; source: ChatMemberSource };

@Injectable()
export class ChannelMembersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async join(
    organizationId: string,
    memberId: string,
    channelId: string,
  ): Promise<ChannelMembershipDto> {
    await requireChannelRow(this.db, organizationId, channelId);

    const [inserted] = await this.db
      .insert(channelMember)
      .values({ channelId, memberId })
      .onConflictDoNothing()
      .returning();
    if (inserted) return toChannelMembershipDto(inserted);

    const existing = await this.findMembership(channelId, memberId);
    if (!existing) throw new NotFoundException("Could not join this channel");
    return toChannelMembershipDto(existing);
  }

  async leave(organizationId: string, memberId: string, channelId: string): Promise<void> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    if (channelRow.createdById === memberId) {
      throw new BadRequestException(
        "Channel owner cannot leave the channel. Delete the channel instead.",
      );
    }

    const deleted = await this.db
      .delete(channelMember)
      .where(and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)))
      .returning({ channelId: channelMember.channelId });
    if (deleted.length === 0) {
      throw new NotFoundException("You are not a member of this channel");
    }
  }

  async getMembers(
    organizationId: string,
    memberId: string,
    channelId: string,
  ): Promise<ChannelMemberDto[]> {
    await requireChannelRow(this.db, organizationId, channelId);
    await requireChannelMembership(
      this.db,
      channelId,
      memberId,
      "You must be a member of this channel to view members",
    );

    const rows = await this.db
      .select()
      .from(channelMember)
      .where(eq(channelMember.channelId, channelId))
      .orderBy(asc(channelMember.joinedAt));

    const joined = await this.joinWithSources(organizationId, rows);
    return joined.map(({ row, source }) => toChannelMemberDto(row, source));
  }

  async addMembers(
    organizationId: string,
    adderMemberId: string,
    channelId: string,
    tenantMemberIds: string[],
  ): Promise<ChannelMemberDto[]> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    if (channelRow.createdById !== adderMemberId) {
      throw new ForbiddenException("Only channel owner can add members");
    }

    const ids = [...new Set(tenantMemberIds)];
    if (ids.length === 0) return [];

    const sources = await loadChatMemberSources(this.db, organizationId, { memberIds: ids });
    if (sources.length !== ids.length) {
      const found = new Set(sources.map((source) => source.member.id));
      throw new NotFoundException(`Tenant member ${ids.find((id) => !found.has(id))} not found`);
    }

    const existing = await this.db
      .select({ memberId: channelMember.memberId })
      .from(channelMember)
      .where(and(eq(channelMember.channelId, channelId), inArray(channelMember.memberId, ids)));
    const alreadyIn = new Set(existing.map((row) => row.memberId));

    const values = ids
      .filter((id) => !alreadyIn.has(id))
      .map((id) => ({ channelId, memberId: id }));
    if (values.length === 0) return [];

    const inserted = await this.db.insert(channelMember).values(values).returning();
    const sourceById = new Map(sources.map((source) => [source.member.id, source]));
    return inserted.flatMap((row) => {
      const source = sourceById.get(row.memberId);
      return source ? [toChannelMemberDto(row, source)] : [];
    });
  }

  async markRead(organizationId: string, memberId: string, channelId: string): Promise<void> {
    await requireChannelRow(this.db, organizationId, channelId);
    const now = new Date();
    await this.db
      .insert(channelMember)
      .values({ channelId, memberId, lastReadAt: now })
      .onConflictDoUpdate({
        target: [channelMember.channelId, channelMember.memberId],
        set: { lastReadAt: now },
      });
  }

  private findMembership(channelId: string, memberId: string) {
    return this.db.query.channelMember.findFirst({
      where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)),
    });
  }

  private async joinWithSources(
    organizationId: string,
    rows: ChannelMembershipRow[],
  ): Promise<MemberRowWithSource[]> {
    const sources = await loadChatMemberSources(this.db, organizationId, {
      memberIds: rows.map((row) => row.memberId),
    });
    const sourceById = new Map(sources.map((source) => [source.member.id, source]));
    return rows.flatMap((row) => {
      const source = sourceById.get(row.memberId);
      return source ? [{ row, source }] : [];
    });
  }
}
