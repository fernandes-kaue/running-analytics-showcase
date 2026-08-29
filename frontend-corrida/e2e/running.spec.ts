import { expect, test } from "@playwright/test";

test("fluxo completo de registro manual", async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name.replace(/\W/g, "-")}-${Date.now()}`;
  const email = `e2e-${suffix}@example.test`;
  const secondEmail = `e2e-segundo-${suffix}@example.test`;
  const password = "teste-seguro-123";
  const futureRaceDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Corredor E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirme a senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: /Olá, Corredor/i })).toBeVisible();

  await page.goto("/tenis/novo");
  await page.getByLabel("Modelo").fill("Pegasus E2E");
  await page.getByLabel("Vida útil estimada").fill("700");
  await page.getByRole("button", { name: "Adicionar tênis" }).click();
  await expect(page.getByRole("heading", { name: "Pegasus E2E" })).toBeVisible();
  await page.getByRole("link", { name: "Editar Pegasus E2E" }).click();
  await page.getByLabel("Vida útil estimada").fill("750");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Limite: 750 km")).toBeVisible();

  await page.goto("/atividades/nova");
  await page.getByLabel("Distância").fill("5.25");
  await page.getByLabel("Minutos").fill("29");
  await page.getByLabel("Segundos").fill("30");
  await page.getByLabel("Tênis usado").selectOption({ label: "Pegasus E2E" });
  await page.getByLabel(/Observações/).fill("Rodagem leve E2E");
  await page.getByRole("button", { name: "Registrar atividade" }).click();
  await expect(page.getByText("5,25 km")).toBeVisible();
  await expect(page.getByText("Rodagem leve E2E")).toBeVisible();

  await page.getByRole("link", { name: /Editar corrida/ }).click();
  await page.getByLabel("Distância").fill("6");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("6 km")).toBeVisible();

  await page.goto("/provas/nova");
  await page.getByLabel("Nome da prova").fill("Prova E2E 10K");
  await page.getByLabel("Data").fill(futureRaceDate);
  await page.getByLabel("Distância").fill("10");
  await page.getByRole("button", { name: "Adicionar prova" }).click();
  await expect(page.getByRole("heading", { name: "Prova E2E 10K" })).toBeVisible();
  await page.getByRole("link", { name: "Editar Prova E2E 10K" }).click();
  await page.getByLabel("Nome da prova").fill("Prova E2E 12K");
  await page.getByLabel("Distância").fill("12");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("heading", { name: "Prova E2E 12K" })).toBeVisible();

  await page.goto("/");
  await expect(page.locator('[aria-labelledby="shoes-title"]').getByText("Pegasus E2E")).toBeVisible();
  await expect(page.getByText("Prova E2E 12K")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Sair da conta" }).first().click();
  await expect(page).toHaveURL(/\/entrar$/);

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Segundo E2E");
  await page.getByLabel("Email").fill(secondEmail);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirme a senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: /Olá, Segundo/i })).toBeVisible();
  await expect(page.getByText("Pegasus E2E")).toHaveCount(0);
  await page.getByRole("button", { name: "Sair da conta" }).first().click();
  await expect(page).toHaveURL(/\/entrar$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: /Olá, Corredor/i })).toBeVisible();

  await page.goto("/tenis");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir Pegasus E2E" }).click();
  await expect(page.locator(".alert[role='alert']")).toContainText("possui atividades");

  await page.goto("/atividades");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Excluir corrida/ }).click();
  await expect(page.getByText("Nenhuma atividade registrada")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("0 km", { exact: true }).first()).toBeVisible();

  await page.goto("/provas");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir Prova E2E 12K" }).click();
  await expect(page.getByText("Nenhuma prova cadastrada")).toBeVisible();

  await page.goto("/tenis");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir Pegasus E2E" }).click();
  await expect(page.getByText("Nenhum tênis cadastrado")).toBeVisible();
});

test("erros de autenticação mantêm o formulário utilizável", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("Email").fill("inexistente@example.test");
  await page.getByLabel("Senha").fill("senha-inexistente");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator(".alert[role='alert']")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("inexistente@example.test");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
