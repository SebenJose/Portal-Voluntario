import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, type OnModuleInit, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, MoreThan, type Repository } from "typeorm";
import { z } from "zod";
import { TransactionsService } from "@/database/transactions.service";
import { UserEntity, publicUser, type PublicUser, type User } from "@/features/auth/user.entity";
import { OrganizationEntity, type Organization } from "@/features/organizations/organization.entity";
import { SessionEntity, type Session } from "@/features/auth/session.entity";
import { hashPassword, checkPassword, validatePasswordBytes } from "@/features/auth/passwords";
import { AuthBudgetService } from "@/features/auth/auth-budget.service";
import type { LoginDto, RegisterDto, RegisterOrganizationDto } from "@/features/auth/auth.dto";
import type { AuthIdentity } from "@/features/auth/auth-context";

export const sessionDurationSeconds = 8 * 60 * 60;
const claimsSchema = z.object({ sub: z.uuid(), sid: z.uuid(), iat: z.number().int(), exp: z.number().int() });

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash: string | undefined;
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<User>,
    @InjectRepository(SessionEntity) private readonly sessions: Repository<Session>,
    @InjectRepository(OrganizationEntity) private readonly organizations: Repository<Organization>,
    private readonly jwt: JwtService,
    private readonly transactions: TransactionsService,
    private readonly budget: AuthBudgetService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hashPassword(randomBytes(18).toString("base64url"));
  }

  async register(input: RegisterDto): Promise<{ message: string }> {
    this.budget.checkRegistration(input.email);
    if (Array.from(input.password).length < 8 || input.password !== input.passwordConfirmation) throw new BadRequestException("Confira a senha e sua confirmação (mínimo de 8 caracteres).");
    const passwordHash = await hashPassword(input.password);
    await this.transactions.run(async (manager) => {
      const users = manager.withRepository(this.users);
      if (!await users.existsBy({ email: input.email })) {
        await users.save(users.create({ name: input.name, email: input.email, passwordHash, role: "volunteer" }));
      }
    });
    return { message: "Se os dados permitiram o cadastro, sua conta foi criada. Entre com seu e-mail e senha." };
  }

  async registerOrganization(input: RegisterOrganizationDto): Promise<{ message: string }> {
    this.budget.checkRegistration(input.email);
    if (Array.from(input.password).length < 8 || input.password !== input.passwordConfirmation) throw new BadRequestException("Confira a senha e sua confirmação (mínimo de 8 caracteres).");
    const passwordHash = await hashPassword(input.password);
    await this.transactions.run(async (manager) => {
      const users = manager.withRepository(this.users);
      // Same response for existing e-mails: registration must not reveal accounts.
      if (await users.existsBy({ email: input.email })) return;
      const owner = await users.save(users.create({ name: input.name, email: input.email, passwordHash, role: "organization" }));
      const organizations = manager.withRepository(this.organizations);
      await organizations.save(organizations.create({ name: input.organizationName, ownerId: owner.id, status: "pending", reviewedAt: null }));
    });
    return { message: "Se os dados permitiram o cadastro, a organização foi registrada e aguarda aprovação da administração. Você já pode entrar para acompanhar a análise." };
  }

  async organizationOf(user: User): Promise<Organization | undefined> {
    if (user.role !== "organization") return undefined;
    return await this.organizations.findOneBy({ ownerId: user.id }) ?? undefined;
  }

  async present(user: User, organization?: Organization): Promise<PublicUser> {
    return publicUser(user, organization ?? await this.organizationOf(user));
  }

  async login(input: LoginDto) {
    this.budget.assertLoginAllowed(input.email);
    validatePasswordBytes(input.password);
    const user = await this.users.createQueryBuilder("user").addSelect("user.passwordHash")
      .where("user.email = :email", { email: input.email }).getOne();
    const passwordHash = user?.passwordHash ?? this.dummyHash;
    if (!passwordHash) throw new ServiceUnavailableException();
    const matches = await checkPassword(input.password, passwordHash);
    if (!user || !matches) {
      this.budget.recordLoginFailure(input.email);
      throw new UnauthorizedException("E-mail ou senha incorretos.");
    }
    this.budget.resetLoginFailures(input.email);
    const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
    const session = await this.transactions.run(async (manager) => {
      const sessions = manager.withRepository(this.sessions);
      await sessions.delete({ expiresAt: LessThan(new Date()) });
      return sessions.save(sessions.create({ userId: user.id, expiresAt }));
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: session.id });
    return { accessToken, expiresAt: expiresAt.toISOString(), user: await this.present(user) };
  }

  async identity(token: string): Promise<AuthIdentity> {
    let claims: z.infer<typeof claimsSchema>;
    try {
      const payload: unknown = await this.jwt.verifyAsync<Record<string, unknown>>(token);
      claims = claimsSchema.parse(payload);
      if (claims.iat > Math.floor(Date.now() / 1000)) throw new Error("Future token");
    } catch {
      throw new UnauthorizedException("Sessão ausente, inválida ou expirada.");
    }
    const session = await this.sessions.findOne({
      where: { id: claims.sid, userId: claims.sub, expiresAt: MoreThan(new Date()) }, relations: { user: true },
    });
    if (!session?.user) throw new UnauthorizedException("Sessão ausente, inválida ou expirada.");
    return { user: session.user, sessionId: session.id, organization: await this.organizationOf(session.user) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.transactions.run(async (manager) => { await manager.withRepository(this.sessions).delete(sessionId); });
  }
}
