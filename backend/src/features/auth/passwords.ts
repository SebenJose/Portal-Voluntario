import { BadRequestException, HttpException } from "@nestjs/common";
import { compare, hash } from "bcrypt";
let activeHashes = 0;

async function guarded<T>(operation: () => Promise<T>): Promise<T> {
  if (activeHashes >= 2) throw new HttpException("Muitas tentativas. Aguarde e tente novamente.", 429);
  activeHashes += 1;
  try { return await operation(); }
  finally { activeHashes -= 1; }
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
