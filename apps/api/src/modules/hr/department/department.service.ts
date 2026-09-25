import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { department, departmentMember, member } from "@teamlyf/db";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import type { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";

type DepartmentRow = typeof department.$inferSelect;

@Injectable()
export class DepartmentService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getDepartments(orgId: string) {
    const departments = await this.db.query.department.findMany({
      where: eq(department.organizationId, orgId),
      orderBy: (d, { asc }) => [asc(d.name)],
    });
    return this.withMembers(departments);
  }

  async getDepartment(orgId: string, departmentId: string) {
    const found = await this.requireDepartment(orgId, departmentId);
    const [departmentWithMembers] = await this.withMembers([found]);
    return departmentWithMembers;
  }

  async createDepartment(orgId: string, dto: CreateDepartmentDto) {
    await this.assertNameFree(orgId, dto.name);

    const [created] = await this.db
      .insert(department)
      .values({ organizationId: orgId, name: dto.name, description: dto.description ?? null })
      .returning();
    return { ...created, members: [] };
  }

  async updateDepartment(orgId: string, departmentId: string, dto: UpdateDepartmentDto) {
    await this.requireDepartment(orgId, departmentId);
    if (dto.name) await this.assertNameFree(orgId, dto.name, departmentId);

    const [updated] = await this.db
      .update(department)
      .set({ name: dto.name, description: dto.description, updatedAt: new Date() })
      .where(and(eq(department.organizationId, orgId), eq(department.id, departmentId)))
      .returning();
    return updated;
  }

  async deleteDepartment(orgId: string, departmentId: string) {
    await this.requireDepartment(orgId, departmentId);
    await this.db
      .delete(department)
      .where(and(eq(department.organizationId, orgId), eq(department.id, departmentId)));
  }

  async addMember(orgId: string, departmentId: string, memberId: string) {
    await this.requireDepartment(orgId, departmentId);

    const memberRow = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.id, memberId)),
      columns: { id: true },
    });
    if (!memberRow) throw new BadRequestException("Member not in this organization");

    const existing = await this.db.query.departmentMember.findFirst({
      where: and(
        eq(departmentMember.departmentId, departmentId),
        eq(departmentMember.memberId, memberId),
      ),
    });
    if (existing) throw new BadRequestException("Member already in this department");

    const [link] = await this.db
      .insert(departmentMember)
      .values({ departmentId, memberId })
      .returning();
    return link;
  }

  async removeMember(orgId: string, departmentId: string, memberId: string) {
    await this.requireDepartment(orgId, departmentId);

    const removed = await this.db
      .delete(departmentMember)
      .where(
        and(
          eq(departmentMember.departmentId, departmentId),
          eq(departmentMember.memberId, memberId),
        ),
      )
      .returning();
    if (!removed.length) throw new NotFoundException("Member is not in this department");
  }

  private async requireDepartment(orgId: string, departmentId: string): Promise<DepartmentRow> {
    const found = await this.db.query.department.findFirst({
      where: and(eq(department.organizationId, orgId), eq(department.id, departmentId)),
    });
    if (!found) throw new NotFoundException("Department not found");
    return found;
  }

  private async assertNameFree(orgId: string, name: string, exceptId?: string) {
    const existing = await this.db.query.department.findFirst({
      where: and(eq(department.organizationId, orgId), eq(department.name, name)),
      columns: { id: true },
    });
    if (existing && existing.id !== exceptId) {
      throw new BadRequestException("Department name already exists");
    }
  }

  /** HR tables have no Drizzle relations, so members are hydrated with two queries. */
  private async withMembers(departments: DepartmentRow[]) {
    if (!departments.length) return [];

    const links = await this.db.query.departmentMember.findMany({
      where: inArray(
        departmentMember.departmentId,
        departments.map((d) => d.id),
      ),
    });
    const memberIds = [...new Set(links.map((l) => l.memberId))];
    const memberRows = memberIds.length
      ? await this.db.query.member.findMany({
          where: inArray(member.id, memberIds),
          columns: { id: true, userId: true, firstName: true, lastName: true, role: true },
        })
      : [];
    const byId = new Map(memberRows.map((m) => [m.id, m]));

    return departments.map((d) => ({
      ...d,
      members: links
        .filter((l) => l.departmentId === d.id)
        .map((l) => byId.get(l.memberId))
        .filter((m): m is NonNullable<typeof m> => m !== undefined),
    }));
  }
}
