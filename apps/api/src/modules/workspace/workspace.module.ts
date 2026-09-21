import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { WorkspaceController } from "./workspace.controller";

@Module({ imports: [DbModule], controllers: [WorkspaceController] })
export class WorkspaceModule {}
