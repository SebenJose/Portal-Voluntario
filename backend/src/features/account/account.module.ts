import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountController } from "@/features/account/account.controller";
import { AccountService } from "@/features/account/account.service";
import { SessionEntity } from "@/features/auth/session.entity";
import { UserEntity } from "@/features/auth/user.entity";
import { OrganizationEntity } from "@/features/organizations/organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SessionEntity, OrganizationEntity])],
  controllers: [AccountController], providers: [AccountService],
})
export class AccountModule {}
