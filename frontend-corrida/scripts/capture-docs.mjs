import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = resolve(import.meta.dirname, "../../docs/images");
const today = new Date();
const isoDate = (daysFromToday) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
};

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/usr/bin/google-chrome-stable",
});
const context = await browser.newContext({
  baseURL,
  locale: "pt-BR",
  reducedMotion: "reduce",
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

try {
  const suffix = Date.now();
  const email = `portfolio-${suffix}@example.test`;
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Kauê Demo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("portfolio-demo-123");
  await page.getByLabel("Confirme a senha").fill("portfolio-demo-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByRole("heading", { name: /Olá, Kauê/i }).waitFor();

  await page.goto("/tenis/novo");
  await page.getByLabel("Modelo").fill("Nike Pegasus 41");
  await page.getByLabel("Vida útil estimada").fill("700");
  await page.getByRole("button", { name: "Adicionar tênis" }).click();
  await page.getByRole("heading", { name: "Nike Pegasus 41" }).waitFor();

  const activities = [
    { days: -8, distance: "5.2", minutes: "29", seconds: "12", note: "Rodagem leve" },
    { days: -4, distance: "8", minutes: "43", seconds: "35", note: "Treino progressivo" },
    { days: -1, distance: "10", minutes: "52", seconds: "8", note: "Longão semanal" },
  ];

  for (const activity of activities) {
    await page.goto("/atividades/nova");
    await page.getByLabel("Data").fill(isoDate(activity.days));
    await page.getByLabel("Distância").fill(activity.distance);
    await page.getByLabel("Minutos").fill(activity.minutes);
    await page.getByLabel("Segundos").fill(activity.seconds);
    await page.getByLabel("Tênis usado").selectOption({ label: "Nike Pegasus 41" });
    await page.getByLabel(/Observações/).fill(activity.note);
    await page.getByRole("button", { name: "Registrar atividade" }).click();
    await page.getByText(activity.note).waitFor();
  }

  await page.goto("/provas/nova");
  await page.getByLabel("Nome da prova").fill("Meia Maratona de Salvador");
  await page.getByLabel("Data").fill(isoDate(90));
  await page.getByLabel("Distância").fill("21.1");
  await page.getByRole("button", { name: "Adicionar prova" }).click();
  await page.getByRole("heading", { name: "Meia Maratona de Salvador" }).waitFor();

  const captures = [
    ["/", "dashboard.png", () => page.getByText("Longão semanal").waitFor()],
    ["/atividades", "atividades.png", () => page.getByText("Longão semanal").waitFor()],
    ["/tenis", "tenis.png", () => page.getByRole("heading", { name: "Nike Pegasus 41" }).waitFor()],
    ["/provas", "provas.png", () => page.getByRole("heading", { name: "Meia Maratona de Salvador" }).waitFor()],
  ];

  for (const [route, filename, waitForContent] of captures) {
    await page.goto(route);
    await waitForContent();
    await page.getByText(email, { exact: true }).evaluate((element) => {
      element.textContent = "demo@example.test";
    });
    await page.screenshot({
      path: resolve(outputDirectory, filename),
      fullPage: true,
    });
  }
} finally {
  await browser.close();
}
