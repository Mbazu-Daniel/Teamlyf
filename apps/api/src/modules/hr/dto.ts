import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
export class CreateEmployeeDto { @IsString() @MaxLength(255) name!: string; @IsEmail() email!: string; @IsOptional() @IsUUID() memberId?: string; @IsOptional() @IsUUID() managerId?: string; @IsOptional() @IsString() jobTitle?: string; }
export class UpdateEmployeeDto { @IsOptional() @IsString() name?: string; @IsOptional() @IsEmail() email?: string; @IsOptional() @IsUUID() managerId?: string; @IsOptional() @IsString() jobTitle?: string; @IsOptional() @IsString() status?: string; }
export class CreateLeaveRequestDto { @IsUUID() employeeId!: string; @IsDateString() startDate!: string; @IsDateString() endDate!: string; @IsOptional() @IsString() reason?: string; }
export class ReviewLeaveRequestDto { @IsString() status!: "approved" | "rejected"; }
