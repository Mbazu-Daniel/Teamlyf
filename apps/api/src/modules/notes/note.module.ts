import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { NoteController } from "./note.controller";
import { NoteService } from "./note.service";

@Module({
  imports: [DbModule],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
