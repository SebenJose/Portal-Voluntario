import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { authUserSchema, loginRequestSchema, type AuthUser, type LoginRequest } from "@/features/auth/schemas/session-schema";
import { registrationSchema, type RegistrationValues } from "@/features/auth/schemas/registration-schema";
import { readLocalData, updateLocalData } from "@/lib/server/local-store";
import { authenticateDemoUser, isDemoEmail } from "@/features/auth/services/demo-credentials";
import { createSessionToken } from "@/features/auth/services/session";

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

function hashPassword(password: string, salt: string): Promise<Buffer> {
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
  // Validate the session configuration before persisting a new account.
  const session = await createSessionToken(user);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await hashPassword(values.password, salt)).toString("hex");
  updateLocalData(accountsFile, accountsSchema, [], (accounts) => {
    if (isDemoEmail(values.email) || accounts.some((account) => account.user.email === values.email)) {
      throw new AccountAlreadyExistsError();
    }
    return [...accounts, { user, salt, passwordHash }];
  });
  return { user, session };
}

export async function authenticateAccount(input: LoginRequest): Promise<AuthUser | null> {
  const credentials = loginRequestSchema.parse(input);
  const demoUser = authenticateDemoUser(credentials);
  if (demoUser) return demoUser;
  const email = credentials.email.trim().toLowerCase();
  const account = readLocalData(accountsFile, accountsSchema, []).find((item) => item.user.email === email);
  if (!account) return null;
  const actualHash = await hashPassword(credentials.password, account.salt);
  const expectedHash = Buffer.from(account.passwordHash, "hex");
  return timingSafeEqual(actualHash, expectedHash) ? account.user : null;
}
