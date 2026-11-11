import { createHash } from "node:crypto";
import { HttpException, Injectable } from "@nestjs/common";

@Injectable()
export class AuthBudgetService {
  private readonly budgets = new Map<string, { count: number; expiresAt: number }>();

  private consume(key: string, limit: number, duration: number): void {
    const now = Date.now();
    for (const [stored, value] of this.budgets) if (value.expiresAt <= now) this.budgets.delete(stored);
    const budget = this.budgets.get(key) ?? { count: 0, expiresAt: now + duration };
    if (budget.count >= limit) throw new HttpException("Muitas tentativas. Aguarde e tente novamente.", 429);
    budget.count += 1;
    this.budgets.set(key, budget);
  }

  check(email: string): void {
    this.consume("aggregate", 30, 60_000);
    this.consume(createHash("sha256").update(email).digest("hex"), 10, 15 * 60_000);
  }
}
