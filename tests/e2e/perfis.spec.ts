import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { configuration, login, trackBrowserErrors } from "./helpers";

trackBrowserErrors();

const origin = { Origin: configuration.E2E_BASE_URL };

/** Cria um voluntário novo pela rota do Next, isolando os dados de cada teste. */
async function createVolunteer(page: Page, label: string): Promise<string> {
  const email = `${label}-${randomUUID().slice(0, 8)}@navegador.example`;
  const password = configuration.E2E_SEED_PASSWORD;
  const response = await page.request.post("/api/auth/register", { headers: origin, data: { name: `Voluntário ${label}`, email, password, passwordConfirmation: password } });
  expect(response.status()).toBe(202);
  return email;
}

async function submitCertificate(page: Page, title: string, category: string, hours: string): Promise<void> {
  await page.goto("/certificados");
  const form = page.getByRole("region", { name: "Registrar certificado externo", exact: true });
  await page.getByLabel("Título da atividade", { exact: true }).fill(title);
  await page.getByLabel("Eixo temático", { exact: true }).selectOption(category);
  await page.getByLabel("Horas declaradas", { exact: true }).fill(hours);
  await page.getByLabel("Descrição", { exact: true }).fill("Comprovante enviado para avaliação no navegador.");
  await page.getByLabel("Comprovante", { exact: true }).setInputFiles({ name: "avaliação.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nAvaliação.\n%%EOF") });
  await form.getByRole("button", { name: "Registrar certificado", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

test("organização se cadastra, aguarda análise e a administração libera a gestão", async ({ page, browser }, testInfo) => {
  const organizationName = `Coletivo Navegador ${randomUUID().slice(0, 6)}`;
  const email = `org-${randomUUID().slice(0, 8)}@navegador.example`;
  await page.goto("/criar-conta");
  await page.getByText("Sou uma organização", { exact: true }).click();
  await page.getByLabel("Nome da organização", { exact: true }).fill(organizationName);
  await page.getByLabel("Nome do responsável", { exact: true }).fill("Responsável do navegador");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(configuration.E2E_SEED_PASSWORD);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(configuration.E2E_SEED_PASSWORD);
  await page.getByRole("button", { name: "Cadastrar organização", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("aguarda aprovação");

  await login(page, email);
  await expect(page.getByRole("heading", { name: "Cadastro em análise", exact: true })).toBeVisible();
  await page.goto("/organizacao");
  await expect(page.getByRole("heading", { name: "Cadastro em análise", exact: true })).toBeVisible();

  const adminContext = await browser.newContext({ baseURL: configuration.E2E_BASE_URL });
  try {
    const admin = await adminContext.newPage();
    await login(admin, "admin@portal.example", "/administracao");
    await expect(admin.getByRole("button", { name: "Pendentes", exact: true })).toHaveAttribute("aria-pressed", "true");
    const card = admin.getByRole("article", { name: organizationName, exact: true });
    await expect(card).toContainText("Aguardando aprovação");
    await card.getByRole("button", { name: `Aprovar ${organizationName}`, exact: true }).click();
    await expect(admin.getByRole("status")).toContainText(`${organizationName} foi aprovada`);
    await expect(card).toHaveCount(0);
    await admin.getByRole("button", { name: "Aprovadas", exact: true }).click();
    await expect(admin.getByRole("article", { name: organizationName, exact: true })).toContainText("Aprovada");
    await admin.screenshot({ path: testInfo.outputPath("admin-organizacoes.png"), fullPage: true });
  } finally {
    await adminContext.close();
  }

  await page.goto("/painel");
  await expect(page.getByRole("heading", { name: "Painel da organização", exact: true })).toBeVisible();
  await expect(page.getByText("Sua organização ainda não publicou atividades", { exact: false })).toBeVisible();
  await page.goto("/organizacao");
  await expect(page.getByRole("heading", { name: "Gestão de atividades", exact: true })).toBeVisible();
});

test("administração avalia certificados; voluntário vê status, justificativa e horas homologadas", async ({ page, browser }, testInfo) => {
  const email = await createVolunteer(page, "avaliacao");
  await login(page, email, "/certificados");
  await submitCertificate(page, "Congresso aprovado no navegador", "Pesquisa", "7");
  await submitCertificate(page, "Oficina recusada no navegador", "Ensino", "4");

  const adminContext = await browser.newContext({ baseURL: configuration.E2E_BASE_URL });
  try {
    const admin = await adminContext.newPage();
    await login(admin, "admin@portal.example", "/administracao/certificados");
    const rejected = admin.getByRole("article", { name: "Oficina recusada no navegador", exact: true });
    await rejected.getByLabel("Recusar", { exact: true }).check();
    await rejected.getByRole("button", { name: "Recusar certificado", exact: true }).click();
    await expect(rejected.getByText("Explique o motivo da recusa", { exact: false })).toBeVisible();
    await rejected.getByLabel("Motivo da recusa", { exact: true }).fill("O comprovante não informa a carga horária.");
    await rejected.getByRole("button", { name: "Recusar certificado", exact: true }).click();
    await expect(admin.getByRole("status")).toContainText("foi recusado");
    const approved = admin.getByRole("article", { name: "Congresso aprovado no navegador", exact: true });
    await approved.getByRole("button", { name: "Aprovar certificado", exact: true }).click();
    await expect(admin.getByRole("status")).toContainText("foi aprovado");
    await admin.screenshot({ path: testInfo.outputPath("admin-certificados.png"), fullPage: true });
  } finally {
    await adminContext.close();
  }

  await page.reload();
  const rejectedCard = page.getByRole("article", { name: "Oficina recusada no navegador", exact: true });
  await expect(rejectedCard).toContainText("Recusado pela administração");
  await expect(rejectedCard).toContainText("O comprovante não informa a carga horária.");
  await expect(rejectedCard.getByRole("button", { name: "Editar registro", exact: true })).toHaveCount(0);
  await expect(page.getByRole("article", { name: "Congresso aprovado no navegador", exact: true })).toContainText("Aprovado pela administração");
  await page.goto("/painel");
  await expect(page.getByText("7h homologadas", { exact: true })).toBeVisible();
});

test("cada perfil vê o próprio menu e é redirecionado das telas de outros perfis", async ({ page, browser }) => {
  const menu = (target: Page) => target.getByRole("navigation", { name: "Navegação principal" });
  const email = await createVolunteer(page, "menu");
  await login(page, email);
  await expect(menu(page).getByRole("link", { name: "Meus certificados", exact: true })).toBeVisible();
  await expect(menu(page).getByRole("link", { name: "Minha conta", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Demonstração de gestão", exact: true })).toHaveCount(0);
  for (const path of ["/administracao", "/organizacao"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new URL("/painel", configuration.E2E_BASE_URL).href);
  }

  const organizationContext = await browser.newContext({ baseURL: configuration.E2E_BASE_URL });
  try {
    const organization = await organizationContext.newPage();
    await login(organization, "organizacao2@portal.example");
    await expect(organization.getByRole("heading", { name: "Painel da organização", exact: true })).toBeVisible();
    await expect(menu(organization).getByRole("link", { name: "Gestão de atividades", exact: true })).toBeVisible();
    await expect(menu(organization).getByRole("link", { name: "Meus certificados", exact: true })).toHaveCount(0);
    for (const path of ["/certificados", "/minhas-atividades", "/administracao"]) {
      await organization.goto(path);
      await expect(organization).toHaveURL(new URL("/painel", configuration.E2E_BASE_URL).href);
    }
  } finally {
    await organizationContext.close();
  }

  const adminContext = await browser.newContext({ baseURL: configuration.E2E_BASE_URL });
  try {
    const admin = await adminContext.newPage();
    await login(admin, "admin@portal.example", "/painel", configuration.E2E_SEED_PASSWORD, "/administracao");
    await expect(menu(admin).getByRole("link", { name: "Certificados externos", exact: true })).toBeVisible();
    await expect(menu(admin).getByRole("link", { name: "Meu painel", exact: true })).toHaveCount(0);
    await admin.goto("/certificados");
    await expect(admin).toHaveURL(new URL("/administracao", configuration.E2E_BASE_URL).href);
  } finally {
    await adminContext.close();
  }
});

test("minha conta atualiza o nome e troca a senha", async ({ page }) => {
  const email = await createVolunteer(page, "conta");
  await login(page, email, "/conta");
  await page.getByLabel("Nome completo", { exact: true }).fill("Nome Renovado");
  await page.getByRole("button", { name: "Salvar perfil", exact: true }).click();
  await expect(page.getByText("Perfil atualizado.", { exact: true })).toBeVisible();
  await expect(page.locator('footer[aria-label="Perfil da conta"]')).toContainText("Nome Renovado");

  const newPassword = `${configuration.E2E_SEED_PASSWORD}-nova`;
  await page.getByLabel("Senha atual", { exact: true }).fill("senha-errada-1");
  await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Alterar senha", exact: true }).click();
  await expect(page.getByRole("region", { name: "Trocar senha", exact: true }).getByRole("alert")).toContainText("senha atual está incorreta");
  await page.getByLabel("Senha atual", { exact: true }).fill(configuration.E2E_SEED_PASSWORD);
  await page.getByRole("button", { name: "Alterar senha", exact: true }).click();
  await expect(page.getByText("Senha alterada.", { exact: false })).toBeVisible();

  await page.context().clearCookies();
  await login(page, email, "/painel", newPassword);
  await expect(page.getByRole("heading", { name: "Meu painel", exact: true })).toBeVisible();
});
