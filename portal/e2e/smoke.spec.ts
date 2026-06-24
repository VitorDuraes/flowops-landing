import { test, expect } from "@playwright/test";

test.describe("smoke das telas principais", () => {
  test("landing carrega na raiz", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("WaveOps").first()).toBeVisible();
  });

  test("checkout carrega com o plano", async ({ page }) => {
    await page.goto("/checkout?plano=essencial");
    await expect(page.getByRole("heading", { name: /Finalizar assinatura/i })).toBeVisible();
    // as 3 formas de pagamento aparecem (match exato p/ nao colidir com textos longos)
    await expect(page.getByText("PIX", { exact: true })).toBeVisible();
    await expect(page.getByText("Cartão", { exact: true })).toBeVisible();
    await expect(page.getByText("Boleto", { exact: true })).toBeVisible();
  });

  test("area do cliente carrega (demo)", async ({ page }) => {
    await page.goto("/cliente");
    await expect(page.locator(".sidebar")).toBeVisible();
  });

  test("painel admin carrega (demo)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin");
    await expect(page.getByText(/Visão geral/i)).toBeVisible();
  });
});
