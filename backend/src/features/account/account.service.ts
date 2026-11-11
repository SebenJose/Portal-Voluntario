import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, type Repository } from "typeorm";
import { TransactionsService } from "@/database/transactions.service";
import type { ChangePasswordDto, UpdateProfileDto } from "@/features/account/account.dto";
import type { AuthIdentity } from "@/features/auth/auth-context";
import { AuthBudgetService } from "@/features/auth/auth-budget.service";
import { AuthService } from "@/features/auth/auth.service";
import { checkPassword, hashPassword } from "@/features/auth/passwords";
import { SessionEntity, type Session } from "@/features/auth/session.entity";
import { UserEntity, type User } from "@/features/auth/user.entity";
import { OrganizationEntity, type Organization } from "@/features/organizations/organization.entity";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<User>,
    @InjectRepository(SessionEntity) private readonly sessions: Repository<Session>,
    @InjectRepository(OrganizationEntity) private readonly organizations: Repository<Organization>,
    private readonly transactions: TransactionsService,
    private readonly budget: AuthBudgetService,
    private readonly auth: AuthService,
  ) {}

  async updateProfile(identity: AuthIdentity, input: UpdateProfileDto) {
    if (input.organizationName !== undefined && identity.user.role !== "organization") {
      throw new ForbiddenException("Somente contas de organização possuem nome de organização.");
    }
    await this.transactions.run(async (manager) => {
      if (input.name !== undefined) await manager.withRepository(this.users).update({ id: identity.user.id }, { name: input.name });
      if (input.organizationName !== undefined) {
        await manager.withRepository(this.organizations).update({ ownerId: identity.user.id }, { name: input.organizationName });
      }
    });
    const user = await this.users.findOneByOrFail({ id: identity.user.id });
    return { user: await this.auth.present(user) };
  }

  async changePassword(identity: AuthIdentity, input: ChangePasswordDto): Promise<void> {
    const email = identity.user.email;
    this.budget.assertLoginAllowed(email);
    if (Array.from(input.newPassword).length < 8 || input.newPassword !== input.newPasswordConfirmation) {
      throw new BadRequestException("Confira a nova senha e sua confirmação (mínimo de 8 caracteres).");
    }
    const stored = await this.users.createQueryBuilder("user").addSelect("user.passwordHash")
      .where("user.id = :id", { id: identity.user.id }).getOneOrFail();
    if (!await checkPassword(input.currentPassword, stored.passwordHash)) {
      // Counts as a failed login so the current password cannot be brute-forced here.
      this.budget.recordLoginFailure(email);
      throw new BadRequestException("A senha atual está incorreta.");
    }
    this.budget.resetLoginFailures(email);
    const passwordHash = await hashPassword(input.newPassword);
    await this.transactions.run(async (manager) => {
      await manager.withRepository(this.users).update({ id: identity.user.id }, { passwordHash });
      // Other devices must sign in again with the new password; this session stays active.
      await manager.withRepository(this.sessions).delete({ userId: identity.user.id, id: Not(identity.sessionId) });
    });
  }
}
