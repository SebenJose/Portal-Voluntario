import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { CurrentAuth, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import { AttendanceDto } from "@/features/organizations/attendance.dto";
import { OrganizationsService } from "@/features/organizations/organizations.service";

@Controller("organizations/activities")
@Roles("organization")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list(@CurrentAuth() identity: AuthIdentity) { return this.organizations.list(identity.user.id); }

  @Patch(":id/participants/:participantId")
  attendance(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string,
    @Param("participantId", ParseUUIDPipe) participantId: string, @Body() input: AttendanceDto) {
    return this.organizations.attendance(identity.user.id, id, participantId, input.status);
  }

  @Post(":id/certificates")
  dispatch(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.organizations.dispatch(identity.user.id, id); }
}
