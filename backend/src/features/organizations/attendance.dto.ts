import { IsIn } from "class-validator";
import { attendanceSchema, type Attendance } from "@/common/domain";

export class AttendanceDto {
  @IsIn(attendanceSchema.options)
  declare status: Attendance;
}
