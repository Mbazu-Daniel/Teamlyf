import { IsIn, IsString, MinLength } from "class-validator";

export class AgentMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;
}

export class ResolveAgentPermissionDto {
  @IsIn(["once", "always", "reject"])
  decision!: "once" | "always" | "reject";
}
