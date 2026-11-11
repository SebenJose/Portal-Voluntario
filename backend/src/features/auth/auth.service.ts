import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, type OnModuleInit, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, LessThan, MoreThan } from "typeorm";
import { z } from "zod";
import { TransactionsService } from "@/database/transactions.service";
import { UserEntity, publicUser } from "@/features/auth/user.entity";
import { SessionEntity } from "@/features/auth/session.entity";
import { hashPassword, checkPassword, validatePasswordBytes } from "@/features/auth/passwords";
import { AuthBudgetService } from "@/features/auth/auth-budget.service";
import type { LoginDto, RegisterDto } from "@/features/auth/auth.dto";
import type { AuthIdentity } from "@/features/auth/auth-context";

export const sessionDurationSeconds = 8 * 60 * 60;
const claimsSchema = z.object({ sub: z.uuid(), sid: z.uuid(), iat: z.number().int(), exp: z.number().int() });

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash: string | undefined;
  constructor(
    @InjectDataSource() private readonly database: DataSource,
    private readonly jwt: JwtService,
    private readonly transactions: TransactionsService,
    private readonly budget: AuthBudgetService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hashPassword(randomBytes(18).toString("base64url"));
  }

  async register(input: RegisterDto): Promise<{ message: string }> {
    this.budget.check(input.email);
    if (Array.from(input.password).length < 8 || input.password !== input.passwordConfirmation) throw new BadRequestException("Confira a senha e sua confirmação (mínimo de 8 caracteres).");
    const passwordHash = await hashPassword(input.password);
    await this.transactions.run(async (manager) => {
      const users = manager.getRepository(UserEntity);
      if (!await users.existsBy({ email: input.email })) {
        await users.save(users.create({ name: input.name, email: input.email, passwordHash, role: "volunteer" }));
      }
    });
    return { message: "Se os dados permitiram o cadastro, sua conta foi criada. Entre com seu e-mail e senha." };
  }

  async login(input: LoginDto) {
    this.budget.check(input.email);
    validatePasswordBytes(input.password);
    const user = await this.database.getRepository(UserEntity).createQueryBuilder("user").addSelect("user.passwordHash")
      .where("user.email = :email", { email: input.email }).getOne();
    const passwordHash = user?.passwordHash ?? this.dummyHash;
    if (!passwordHash) throw new ServiceUnavailableException();
    const matches = await checkPassword(input.password, passwordHash);
    if (!user || !matches) throw new UnauthorizedException("E-mail ou senha incorretos.");
    const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
    const session = await this.transactions.run(async (manager) => {
      const sessions = manager.getRepository(SessionEntity);
      await sessions.delete({ expiresAt: LessThan(new Date()) });
      return sessions.save(sessions.create({ userId: user.id, expiresAt }));
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: session.id });
    return { accessToken, expiresAt: expiresAt.toISOString(), user: publicUser(user) };
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
    const session = await this.database.getRepository(SessionEntity).findOne({
      where: { id: claims.sid, userId: claims.sub, expiresAt: MoreThan(new Date()) }, relations: { user: true },
    });
    if (!session?.user) throw new UnauthorizedException("Sessão ausente, inválida ou expirada.");
    return { user: session.user, sessionId: session.id };
  }

  async logout(sessionId: string): Promise<void> {
    await this.transactions.run(async (manager) => { await manager.getRepository(SessionEntity).delete(sessionId); });
  }
}
