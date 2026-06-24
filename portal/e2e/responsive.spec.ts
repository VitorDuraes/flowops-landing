import { test, expect } from "@playwright/test";

// Regressao do bug "tela toda embacada ao clicar no menu". No desktop nao deve haver
// hamburguer nem scrim; no mobile o drawer abre com dim suave e fecha ao clicar fora.
test.describe("layout responsivo (drawer/scrim)", () => {
  test("desktop: sidebar fixa, sem hamburguer e sem scrim bloqueando", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/cliente");
    await expect(page.locator(".hamb")).toBeHidden();
    await expect(page.locator(".sidebar")).toBeVisible();
    // o scrim do drawer existe no DOM mas NAO pode estar ativo (embacando)
    await expect(page.locator(".drawer-scrim")).not.toHaveClass(/open/);
  });

  test("mobile: hamburguer abre o drawer e clicar fora fecha", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/cliente");
    const hamb = page.locator(".hamb");
    await expect(hamb).toBeVisible();
    await hamb.click();
    const scrim = page.locator(".drawer-scrim");
    await expect(scrim).toHaveClass(/open/);
    // clica fora da sidebar (que tem 280px) para fechar
    await scrim.click({ position: { x: 360, y: 400 } });
    await expect(scrim).not.toHaveClass(/open/);
  });
});
