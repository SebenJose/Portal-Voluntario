import { test, expect, type Page } from "@playwright/test";
import { z } from "zod";

export const configuration = z.object({ E2E_SEED_PASSWORD: z.string().min(8), E2E_BASE_URL: z.url() }).parse(process.env);

/** Falha o teste se a página lançar erros de JavaScript. */
export function trackBrowserErrors(): void {
  const browserErrors = new WeakMap<Page, string[]>();
  test.beforeEach(({ page }) => {
    const errors: string[] = [];
    browserErrors.set(page, errors);
    page.on("pageerror", (error) => { errors.push(error.message); process.stderr.write(`Erro de página: ${error.message}\n`); });
  });
  test.afterEach(({ page }) => { expect(browserErrors.get(page)).toEqual([]); });
}

export async function login(page: Page, email: string, destination = "/painel", password = configuration.E2E_SEED_PASSWORD, landing = destination): Promise<void> {
  await page.goto(`/entrar?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar no portal", exact: true }).click();
  await expect(page).toHaveURL(new URL(landing, configuration.E2E_BASE_URL).href);
}
