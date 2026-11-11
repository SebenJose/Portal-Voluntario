import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentAuth, OptionalAuth, OptionalUser, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import type { User } from "@/features/auth/user.entity";
import { CreateOpportunityDto, OpportunityQueryDto, UpdateOpportunityDto } from "@/features/opportunities/opportunity.dto";
import { OpportunitiesService } from "@/features/opportunities/opportunities.service";

@Controller("opportunities")
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get() @OptionalAuth()
  list(@OptionalUser() user: User | undefined, @Query() query: OpportunityQueryDto) { return this.opportunities.catalog(user?.id, query); }

  @Get(":id") @OptionalAuth()
  get(@Param("id") id: string) { return this.opportunities.get(id); }

  @Post() @Roles("organization")
  create(@CurrentAuth() identity: AuthIdentity, @Body() input: CreateOpportunityDto) { return this.opportunities.create(identity.user.id, input); }

  @Patch(":id") @Roles("organization")
  update(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string, @Body() input: UpdateOpportunityDto) { return this.opportunities.update(identity.user.id, id, input); }

  @Delete(":id") @Roles("organization") @HttpCode(204)
  remove(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.remove(identity.user.id, id); }

  @Post(":id/registrations") @Roles("volunteer")
  enroll(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.enroll(identity.user.id, id); }

  @Delete(":id/registrations") @Roles("volunteer")
  cancel(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.cancel(identity.user.id, id); }
}
