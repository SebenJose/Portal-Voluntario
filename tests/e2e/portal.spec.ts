import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, type Locator } from "@playwright/test";
import { configuration, login, trackBrowserErrors } from "./helpers";

trackBrowserErrors();

async function fillActivity(editor: Locator, id: string, title: string): Promise<void> {
  await editor.getByLabel("Identificador", { exact: true }).fill(id);
  await editor.getByLabel("Título", { exact: true }).fill(title);
  await editor.getByLabel("Local", { exact: true }).fill("Santa Helena");
  await editor.getByLabel("Período para exibição", { exact: true }).fill("15 de janeiro de 2027");
  await editor.getByLabel("Horários para exibição", { exact: true }).fill("Das 8h às 12h");
  await editor.getByLabel("Carga horária", { exact: true }).fill("4");
  await editor.getByLabel("Vagas", { exact: true }).fill("2");
  await editor.getByLabel("Descrição", { exact: true }).fill("Atividade comunitária criada pelo navegador.");
  await editor.getByLabel("Data 1", { exact: true }).fill("2027-01-15");
  await editor.getByRole("button", { name: "Salvar atividade", exact: true }).click();
  await expect(editor.getByRole("status")).toHaveText("Atividade salva.");
}

test("cadastro, login, certificados CRUD/download, logout e inscrição persistente", async ({ page, context }, testInfo) => {
  const email = `${randomUUID()}@portal.example`;
  await page.goto("/certificados");
  await expect(page).toHaveURL(/\/entrar\?next=/u);
  await page.getByRole("link", { name: "Crie sua conta", exact: true }).click();
  await page.getByLabel("Nome completo").fill("Pessoa do navegador");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(configuration.E2E_SEED_PASSWORD);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(configuration.E2E_SEED_PASSWORD);
  await page.getByRole("button", { name: "Criar minha conta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Entre com seu e-mail e senha");
  await login(page, email, "/certificados");
  await expect(page.getByRole("heading", { name: "Meus certificados", exact: true })).toBeVisible();
  expect((await context.cookies()).find((cookie) => cookie.name === "portal_session")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("portal_session");

  const pdfContents = "%PDF-1.4\nComprovante do navegador.\n%%EOF";
  await page.getByLabel("Título da atividade", { exact: true }).fill("Certificado do navegador");
  await page.getByLabel("Horas declaradas", { exact: true }).fill("8");
  await page.getByLabel("Descrição", { exact: true }).fill("Atividade externa cadastrada pelo navegador.");
  await page.getByLabel("Comprovante", { exact: true }).setInputFiles({ name: "comprovante.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdfContents) });
  await page.getByRole("region", { name: "Registrar certificado externo", exact: true }).getByRole("button", { name: "Registrar certificado", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Certificado do navegador", exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar comprovante de Certificado do navegador", exact: true }).click();
  const downloaded = await downloadEvent;
  const file = await downloaded.path();
  expect(file).toBeTruthy();
  if (file) expect(await readFile(file, "utf8")).toBe(pdfContents);

  await page.getByRole("button", { name: "Editar registro", exact: true }).click();
  const edit = page.getByRole("form", { name: "Editar Certificado do navegador", exact: true });
  await edit.getByLabel("Título da atividade", { exact: true }).fill("Certificado atualizado");
  await edit.getByLabel("Horas declaradas", { exact: true }).fill("9");
  await edit.getByRole("button", { name: "Salvar registro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Certificado atualizado", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Certificado atualizado", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("certificados.png"), fullPage: true });
  await page.getByRole("button", { name: "Excluir registro", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão do registro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nenhum certificado registrado", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta", exact: true }).click();
  await page.getByRole("button", { name: "Sim, sair", exact: true }).click();
  await expect(page).toHaveURL(configuration.E2E_BASE_URL + "/");
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/entrar\?next=/u);

  await login(page, email, "/oportunidades");
  const activity = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Dados abertos para impacto social", exact: true }) });
  await activity.getByRole("button", { name: "Quero participar", exact: true }).click();
  await expect(activity.getByRole("button", { name: "Cancelar inscrição", exact: true })).toBeVisible();
  await page.reload();
  await expect(activity.getByRole("button", { name: "Cancelar inscrição", exact: true })).toBeVisible();
  await page.goto("/minhas-atividades");
  await expect(page.getByRole("heading", { name: "Dados abertos para impacto social", exact: true, level: 3 })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar inscrição", exact: true }).click();
  await page.getByRole("button", { name: "Sim, cancelar inscrição", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dados abertos para impacto social", exact: true })).toHaveCount(0);
});

test("organização cria, atualiza e exclui atividade; presença e emissão refletem no painel do voluntário", async ({ page, browser }, testInfo) => {
  await login(page, "organizacao@portal.example", "/organizacao");
  await expect(page.getByRole("heading", { name: "Gestão de atividades", exact: true })).toBeVisible();
  await page.getByText("Criar atividade", { exact: true }).click();
  const create = page.locator("details").filter({ has: page.locator("summary", { hasText: "Criar atividade" }) });
  await fillActivity(create, "atividade-navegador", "Atividade no navegador");
  await page.getByLabel("Atividade para gerenciar").selectOption("atividade-navegador");
  const editor = page.locator("details").filter({ has: page.locator("summary", { hasText: "Editar atividade selecionada" }) });
  await editor.locator("summary").click();
  await expect(editor.getByLabel("Título", { exact: true })).toHaveValue("Atividade no navegador");
  await editor.getByLabel("Título", { exact: true }).fill("Atividade atualizada no navegador");
  await editor.getByRole("button", { name: "Salvar atividade", exact: true }).click();
  await expect(page.getByLabel("Atividade para gerenciar")).toContainText("Atividade atualizada no navegador");

  const volunteerContext = await browser.newContext({ baseURL: configuration.E2E_BASE_URL });
  try {
    const volunteer = await volunteerContext.newPage();
    await login(volunteer, "voluntario@portal.example", "/oportunidades");
    const activity = volunteer.getByRole("article").filter({ has: volunteer.getByRole("heading", { name: "Atividade atualizada no navegador", exact: true }) });
    await activity.getByRole("button", { name: "Quero participar", exact: true }).click();
    await expect(activity.getByRole("button", { name: "Cancelar inscrição", exact: true })).toBeVisible();
    await page.reload();
    await page.getByLabel("Atividade para gerenciar").selectOption("atividade-navegador");
    const participant = page.getByRole("row").filter({ hasText: "voluntario@portal.example" });
    await participant.getByRole("button", { name: "Presente", exact: true }).click();
    await expect(participant.getByRole("button", { name: "Presente", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Emitir certificados", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Certificados emitidos para 1 participante");
    await volunteer.goto("/painel");
    await expect(volunteer.getByRole("region", { name: "Banco de horas", exact: true })).toContainText("4h");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath("gestao.png"), fullPage: true });
  } finally { await volunteerContext.close(); }

  await create.locator("summary").click();
  await fillActivity(create, "atividade-excluir", "Atividade para excluir");
  await page.getByLabel("Atividade para gerenciar").selectOption("atividade-excluir");
  const removable = page.locator("details").filter({ has: page.locator("summary", { hasText: "Editar atividade selecionada" }) });
  await removable.locator("summary").click();
  await expect(removable.getByLabel("Identificador", { exact: true })).toHaveValue("atividade-excluir");
  await removable.getByRole("button", { name: "Excluir atividade", exact: true }).click();
  await removable.getByRole("button", { name: "Confirmar exclusão da atividade", exact: true }).click();
  await expect(page.getByLabel("Atividade para gerenciar").locator("option[value='atividade-excluir']")).toHaveCount(0);
});

test("catálogo apresenta erro recuperável e funciona em tela estreita", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/opportunities", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Falha temporária do teste." }) }));
  await page.goto("/oportunidades");
  await expect(page.getByRole("heading", { name: "Não foi possível carregar o catálogo", exact: true })).toBeVisible();
  await page.unroute("**/api/opportunities");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Horta comunitária e educação ambiental", exact: true })).toBeVisible();
  await expect(page.getByRole("article").first()).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("catalogo-mobile.png"), fullPage: true });
});
