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
import { CreateLabelDto, UpdateLabelDto } from "../dto";
import { LabelService } from "./label.service";

@ApiTags("Labels")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/labels")
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a label" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  createLabel(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: CreateLabelDto,
  ) {
    return this.labelService.createLabel(orgId, projectId, body);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "List labels" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getLabels(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.labelService.getLabels(orgId, projectId);
  }

  @Patch(":labelId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Update a label" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "labelId" })
  updateLabel(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("labelId") labelId: string,
    @Body() body: UpdateLabelDto,
  ) {
    return this.labelService.updateLabel(orgId, projectId, labelId, body);
  }

  @Delete(":labelId")
  @RequirePermission("pm", "delete", "projectId")
  @ApiOperation({ summary: "Delete a label" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "labelId" })
  deleteLabel(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("labelId") labelId: string,
  ) {
    return this.labelService.deleteLabel(orgId, projectId, labelId);
  }
}
