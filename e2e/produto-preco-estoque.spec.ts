import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: edição de preço e estoque em /admin/produtos.
 * Fluxo: login → abrir 1º produto → alterar preço e estoque → salvar
 *        → reload → reabrir → confirmar valores persistidos.
 *
 * Pré-requisitos (env):
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 *
 * Execução:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... bun run e2e
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

test.skip(
  !ADMIN_EMAIL || !ADMIN_PASSWORD,
  "Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para rodar o teste.",
);

async function login(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/e-?mail/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/senha/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
}

async function openFirstProduct(page: Page) {
  await page.goto("/admin/produtos");
  await expect(page.getByRole("heading", { name: /produtos e serviços/i })).toBeVisible();
  const productRow = page
    .locator("div", { has: page.getByText("Produto", { exact: true }) })
    .first();
  await expect(productRow).toBeVisible();
  await productRow.getByRole("button").first().click();
  await expect(page.getByText(/preço \(r\$\)/i)).toBeVisible();
}

test.describe("Admin — produtos: preço e estoque", () => {
  test("edita preço + estoque, salva, recarrega e persiste", async ({ page }) => {
    await login(page);
    await openFirstProduct(page);

    const priceInput = page.getByLabel(/preço \(r\$\)/i);
    const stockInput = page.getByLabel(/estoque/i);

    await expect(priceInput).toBeVisible();
    await expect(stockInput).toBeVisible();

    const initialPrice = await priceInput.inputValue();
    const initialStock = await stockInput.inputValue();

    // Alvos determinísticos e distintos do valor atual, para evitar falso-positivo.
    const targetPrice = initialPrice === "1234.56" ? "987.65" : "1234.56";
    const targetStock = initialStock === "17" ? "42" : "17";

    await priceInput.fill(targetPrice);
    await stockInput.fill(targetStock);
    await expect(priceInput).toHaveValue(targetPrice);
    await expect(stockInput).toHaveValue(targetStock);

    await page.getByRole("button", { name: /^salvar$/i }).click();

    // Confirma sucesso e fechamento do Sheet
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/preço \(r\$\)/i)).toBeHidden({ timeout: 10_000 });

    // Reload real
    await page.reload();
    await expect(page.getByRole("heading", { name: /produtos e serviços/i })).toBeVisible();

    // Reabre o mesmo produto e valida persistência
    await openFirstProduct(page);
    const priceAfter = page.getByLabel(/preço \(r\$\)/i);
    const stockAfter = page.getByLabel(/estoque/i);

    await expect(priceAfter).toHaveValue(targetPrice);
    await expect(stockAfter).toHaveValue(targetStock);

    // Restaura os valores originais para não afetar catálogo em execuções futuras
    await priceAfter.fill(initialPrice);
    await stockAfter.fill(initialStock);
    await page.getByRole("button", { name: /^salvar$/i }).click();
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 10_000 });
  });
});
