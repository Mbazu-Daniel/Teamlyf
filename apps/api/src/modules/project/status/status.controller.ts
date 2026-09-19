import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateStatusDto, UpdateStatusDto } from "../dto";
import { StatusService } from "./status.service";

@ApiTags("Statuses")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/statuses")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a status" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  createStatus(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: CreateStatusDto,
  ) {
    return this.statusService.createStatus(orgId, projectId, body);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "List statuses" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getStatuses(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.statusService.getStatuses(orgId, projectId);
  }

  @Patch(":statusId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Update a status" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "statusId" })
  updateStatus(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("statusId") statusId: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.statusService.updateStatus(orgId, projectId, statusId, body);
  }

  @Delete(":statusId")
  @RequirePermission("pm", "delete", "projectId")
  @ApiOperation({ summary: "Delete a status" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "statusId" })
  deleteStatus(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("statusId") statusId: string,
  ) {
    return this.statusService.deleteStatus(orgId, projectId, statusId);
  }
}
