import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PartialType } from "@nestjs/swagger";
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { calendarEvent, type Database } from "@teamlyf/db";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { DbModule } from "../../common/db/db.module";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";

class EventInput {
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) location?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsIn(["violet", "blue", "green", "amber", "rose"]) color?: string;
}
class EventUpdate extends PartialType(EventInput) {}
class EventRange {
  @IsDateString() from!: string;
  @IsDateString() to!: string;
}

@Injectable()
export class ScheduleService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  list(org: string, range: EventRange) {
    const from = new Date(range.from),
      to = new Date(range.to);
    if (to <= from || to.getTime() - from.getTime() > 370 * 86400000)
      throw new BadRequestException("Choose a date range of up to one year.");
    return this.db
      .select()
      .from(calendarEvent)
      .where(
        and(
          eq(calendarEvent.organizationId, org),
          lt(calendarEvent.startsAt, to),
          gt(calendarEvent.endsAt, from),
        ),
      )
      .orderBy(asc(calendarEvent.startsAt));
  }
  private validate(title: string, startsAt: Date, endsAt: Date) {
    if (!title.trim()) throw new BadRequestException("Enter an event title.");
    if (endsAt <= startsAt) throw new BadRequestException("The end must be after the start.");
  }
  async create(org: string, creator: string, input: EventInput) {
    const startsAt = new Date(input.startsAt),
      endsAt = new Date(input.endsAt);
    this.validate(input.title, startsAt, endsAt);
    const [event] = await this.db
      .insert(calendarEvent)
      .values({
        ...input,
        title: input.title.trim(),
        organizationId: org,
        creatorId: creator,
        startsAt,
        endsAt,
      })
      .returning();
    return event;
  }
  async update(org: string, id: string, input: EventUpdate) {
    return this.db.transaction(async (tx) => {
      const where = and(eq(calendarEvent.organizationId, org), eq(calendarEvent.id, id));
      const [current] = await tx.select().from(calendarEvent).where(where).for("update");
      if (!current) throw new NotFoundException("Event not found");
      const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
      const endsAt = input.endsAt ? new Date(input.endsAt) : current.endsAt;
      this.validate(input.title ?? current.title, startsAt, endsAt);
      const [updated] = await tx
        .update(calendarEvent)
        .set({ ...input, title: input.title?.trim(), startsAt, endsAt, updatedAt: new Date() })
        .where(where)
        .returning();
      return updated;
    });
  }
  async delete(org: string, id: string) {
    const rows = await this.db
      .delete(calendarEvent)
      .where(and(eq(calendarEvent.organizationId, org), eq(calendarEvent.id, id)))
      .returning({ id: calendarEvent.id });
    if (!rows.length) throw new NotFoundException("Event not found");
    return { success: true };
  }
}

@Controller("organization/:orgId/events")
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
class ScheduleController {
  constructor(private readonly events: ScheduleService) {}
  @Get()
  @RequirePermission("pm", "read")
  list(@Param("orgId") org: string, @Query() range: EventRange) {
    return this.events.list(org, range);
  }
  @Post()
  @RequirePermission("pm", "create")
  create(
    @Param("orgId") org: string,
    @CurrentMember() member: SessionMember,
    @Body() input: EventInput,
  ) {
    return this.events.create(org, member.id, input);
  }
  @Patch(":id")
  @RequirePermission("pm", "update")
  update(
    @Param("orgId") org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: EventUpdate,
  ) {
    return this.events.update(org, id, input);
  }
  @Delete(":id")
  @RequirePermission("pm", "delete")
  delete(@Param("orgId") org: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.events.delete(org, id);
  }
}

@Module({ imports: [DbModule], controllers: [ScheduleController], providers: [ScheduleService] })
export class ScheduleModule {}
