import { BadRequestException, HttpException } from "@nestjs/common";
import { compare, hash } from "bcrypt";

// bcrypt is CPU-bound: run at most two at a time and queue a few more instead of rejecting
// legitimate concurrent logins. Only a full queue answers 429.
const maximumActive = 2;
const maximumQueued = 16;
let active = 0;
const waiting: Array<() => void> = [];

async function guarded<T>(operation: () => Promise<T>): Promise<T> {
  if (active < maximumActive) active += 1;
  else if (waiting.length < maximumQueued) await new Promise<void>((resolve) => { waiting.push(resolve); });
  else throw new HttpException("Muitas tentativas. Aguarde e tente novamente.", 429);
  try { return await operation(); }
  finally {
    // Hand the slot directly to the next waiting operation, keeping the active count unchanged.
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  }
}

export function validatePasswordBytes(password: string): void {
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new BadRequestException("A senha deve ocupar até 72 bytes em UTF-8. Use uma senha menor.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordBytes(password);
  return guarded(() => hash(password, 12));
}

export async function checkPassword(password: string, passwordHash: string): Promise<boolean> {
  validatePasswordBytes(password);
  return guarded(() => compare(password, passwordHash));
}
