import "server-only";

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { authUserSchema, loginRequestSchema, type AuthUser, type LoginRequest } from "@/features/auth/schemas/session-schema";
import { registrationSchema, type RegistrationValues } from "@/features/auth/schemas/registration-schema";
import { readLocalData, updateLocalData } from "@/lib/server/local-store";
import { RequestSecurityError } from "@/lib/server/request-security";

const accountSchema = z.object({
  user: authUserSchema,
  salt: z.string().regex(/^[a-f0-9]{32}$/u),
  passwordHash: z.string().regex(/^[a-f0-9]{128}$/u),
});
const accountsSchema = z.array(accountSchema);
const accountsFile = "accounts.json";

export class AccountAlreadyExistsError extends Error {
  constructor() {
    super("Já existe uma conta com este e-mail. Entre na sua conta.");
    this.name = "AccountAlreadyExistsError";
  }
}

let activeHashes = 0;
const dummySalt = randomBytes(16).toString("hex");

async function hashPassword(password: string, salt: string): Promise<Buffer> {
  if (activeHashes >= 2) throw new RequestSecurityError("Muitas tentativas. Aguarde e tente novamente.", 429, 5);
  activeHashes += 1;
  try {
    return await derivePassword(password, salt);
  } finally {
    activeHashes -= 1;
  }
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function createAccount(input: RegistrationValues) {
  const values = registrationSchema.parse(input);
  const user: AuthUser = {
    id: randomUUID(),
    email: values.email,
    name: values.name,
    role: "volunteer",
  };
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await hashPassword(values.password, salt)).toString("hex");
  updateLocalData(accountsFile, accountsSchema, [], (accounts) => {
    if (accounts.some((account) => account.user.email === values.email)) {
      throw new AccountAlreadyExistsError();
    }
    return [...accounts, { user, salt, passwordHash }];
  });
  return user;
}

export async function authenticateAccount(input: LoginRequest): Promise<AuthUser | null> {
  const credentials = loginRequestSchema.parse(input);
  const email = credentials.email.trim().toLowerCase();
  const account = readLocalData(accountsFile, accountsSchema, []).find((item) => item.user.email === email);
  const actualHash = await hashPassword(credentials.password, account?.salt ?? dummySalt);
  if (!account) return null;
  const expectedHash = Buffer.from(account.passwordHash, "hex");
  return timingSafeEqual(actualHash, expectedHash) ? account.user : null;
}

export function getAccountUser(userId: string): AuthUser | null {
  return readLocalData(accountsFile, accountsSchema, []).find((account) => account.user.id === userId)?.user ?? null;
}
