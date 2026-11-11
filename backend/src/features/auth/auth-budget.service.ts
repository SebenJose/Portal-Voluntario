import { createHash } from "node:crypto";
import { HttpException, Injectable } from "@nestjs/common";

interface Budget { count: number; expiresAt: number }

const aggregateWindow = 60_000;
const accountWindow = 15 * 60_000;
const aggregateLimit = 30;
const accountLimit = 10;

@Injectable()
export class AuthBudgetService {
  private readonly budgets = new Map<string, Budget>();

  private current(key: string): Budget | undefined {
    const now = Date.now();
    for (const [stored, value] of this.budgets) if (value.expiresAt <= now) this.budgets.delete(stored);
    return this.budgets.get(key);
  }

  private assertBelow(key: string, limit: number): void {
    if ((this.current(key)?.count ?? 0) >= limit) throw new HttpException("Muitas tentativas. Aguarde e tente novamente.", 429);
  }

  private increment(key: string, duration: number): void {
    const budget = this.current(key) ?? { count: 0, expiresAt: Date.now() + duration };
    budget.count += 1;
    this.budgets.set(key, budget);
  }

  private accountKey(scope: "login" | "register", email: string): string {
    return `${scope}:${createHash("sha256").update(email).digest("hex")}`;
  }

  // Every registration attempt counts; it uses its own keys so it cannot lock anyone's login.
  checkRegistration(email: string): void {
    const key = this.accountKey("register", email);
    this.assertBelow("register:aggregate", aggregateLimit);
    this.assertBelow(key, accountLimit);
    this.increment("register:aggregate", aggregateWindow);
    this.increment(key, accountWindow);
  }

  // Only failed logins count, so successful users do not consume the budget.
  assertLoginAllowed(email: string): void {
    this.assertBelow("login:aggregate", aggregateLimit);
    this.assertBelow(this.accountKey("login", email), accountLimit);
  }

  recordLoginFailure(email: string): void {
    this.increment("login:aggregate", aggregateWindow);
    this.increment(this.accountKey("login", email), accountWindow);
  }

  resetLoginFailures(email: string): void {
    this.budgets.delete(this.accountKey("login", email));
  }
}
