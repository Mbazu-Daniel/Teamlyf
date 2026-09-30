import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { DATABASE } from "../../../common/db/db.provider";
import { loadChatMemberSources, toChatTenantMember } from "../shared/member.mapper";
import { ChatPresenceService } from "../shared/presence.service";
import type { ChatMembersQueryDto } from "./dto/chat-members-query.dto";

export type ChatMembersPage = {
  records: ReturnType<typeof toChatTenantMember>[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

@Injectable()
export class ChatMembersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly presence: ChatPresenceService,
  ) {}

  async list(organizationId: string, query: ChatMembersQueryDto): Promise<ChatMembersPage> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 200);

    const sources = await loadChatMemberSources(this.db, organizationId);
    const presence = await this.presence.presenceFor(sources.map((source) => source.member.id));
    const records = sources.map((source) =>
      toChatTenantMember(source, presence.get(source.member.id) ?? false),
    );

    const total = records.length;
    const start = (page - 1) * limit;
    return {
      records: records.slice(start, start + limit),
      meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    };
  }

  async me(organizationId: string, memberId: string) {
    const [source] = await loadChatMemberSources(this.db, organizationId, {
      memberIds: [memberId],
    });
    if (!source) throw new NotFoundException("Member not found in this organization");
    return toChatTenantMember(source, await this.presence.isOnline(memberId));
  }
}
