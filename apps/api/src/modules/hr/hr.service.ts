import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { employee, leaveRequest } from "@teamlyf/db/workspace-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { TenantScopedRepository } from "../../common/db/tenant-scoped.repository";
import type { CreateEmployeeDto, CreateLeaveRequestDto, ReviewLeaveRequestDto, UpdateEmployeeDto } from "./dto";
@Injectable()
export class HrService extends TenantScopedRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) { super(); }
  listEmployees(organizationId: string) { return this.db.query.employee.findMany({ where: eq(employee.organizationId, this.assertOrganizationId(organizationId)) }); }
  async createEmployee(organizationId: string, dto: CreateEmployeeDto) { const [created] = await this.db.insert(employee).values({ organizationId, ...dto, memberId: dto.memberId ?? null, managerId: dto.managerId ?? null, jobTitle: dto.jobTitle ?? null }).returning(); return created; }
  async updateEmployee(organizationId: string, employeeId: string, dto: UpdateEmployeeDto) { await this.requireEmployee(organizationId, employeeId); const [updated] = await this.db.update(employee).set({ ...dto, updatedAt: new Date() }).where(and(eq(employee.id, employeeId), eq(employee.organizationId, organizationId))).returning(); return updated; }
  async orgChart(organizationId: string) { const rows = await this.listEmployees(organizationId); return rows.map((item) => ({ ...item, reports: rows.filter((candidate) => candidate.managerId === item.id) })); }
  async listLeave(organizationId: string) {
    const rows = await this.db.select({ request: leaveRequest }).from(leaveRequest).innerJoin(employee, eq(leaveRequest.employeeId, employee.id)).where(eq(employee.organizationId, this.assertOrganizationId(organizationId)));
    return rows.map((row) => row.request);
  }
  async requestLeave(organizationId: string, memberId: string, dto: CreateLeaveRequestDto) { await this.requireEmployee(organizationId, dto.employeeId); if (new Date(dto.endDate) < new Date(dto.startDate)) throw new BadRequestException("End date must be after start date"); const [created] = await this.db.insert(leaveRequest).values({ employeeId: dto.employeeId, requestedById: memberId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), reason: dto.reason ?? null }).returning(); return created; }
  async reviewLeave(organizationId: string, leaveId: string, reviewerId: string, dto: ReviewLeaveRequestDto) { const leave = this.requireScoped((await this.listLeave(organizationId)).find((item) => item.id === leaveId), "Leave request"); const [updated] = await this.db.update(leaveRequest).set({ status: dto.status, reviewedById: reviewerId, updatedAt: new Date() }).where(eq(leaveRequest.id, leave.id)).returning(); return updated; }
  private async requireEmployee(organizationId: string, employeeId: string) { return this.requireScoped(await this.db.query.employee.findFirst({ where: and(eq(employee.id, employeeId), eq(employee.organizationId, this.assertOrganizationId(organizationId))) }), "Employee"); }
}
