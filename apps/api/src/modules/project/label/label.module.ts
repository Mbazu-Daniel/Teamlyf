import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { LabelController } from "./label.controller";
import { LabelService } from "./label.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}
