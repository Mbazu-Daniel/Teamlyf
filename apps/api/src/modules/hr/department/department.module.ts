import { Module } from "@nestjs/common";
import { HrSharedModule } from "../hr-shared.module";
import { DepartmentController } from "./department.controller";
import { DepartmentService } from "./department.service";

@Module({
  imports: [HrSharedModule],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
