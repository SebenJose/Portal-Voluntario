import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { attendanceSchema, type Attendance } from "@/common/domain";

export class AttendanceDto {
  @ApiProperty({ enum: attendanceSchema.options, example: "Presente" })
  @IsIn(attendanceSchema.options)
  declare status: Attendance;
}
