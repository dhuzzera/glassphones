import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: garante que o campo battery_health é editado, salvo e persiste
 * corretamente após reload da página /admin/produtos.
 *
 * Pré-requisitos (env):
 *   E2E_ADMIN_EMAIL     — email de um usuário com role admin
 *   E2E_ADMIN_PASSWORD  — senha desse usuário
 *
 * Execução:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... bunx playwright test
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
  // aguarda redirect para fora de /auth
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
}

async function openFirstProduct(page: Page) {
  await page.goto("/admin/produtos");
  await expect(page.getByRole("heading", { name: /produtos e serviços/i })).toBeVisible();

  // Primeira linha marcada com badge "Produto" (evita clicar num serviço)
  const productRow = page
    .locator("div", { has: page.getByText("Produto", { exact: true }) })
    .first();
  await expect(productRow).toBeVisible();

  // Botão de editar (ícone Pencil) na linha
  await productRow.getByRole("button").first().click();

  // O Sheet abre com o campo Saúde da bateria
  await expect(page.getByText(/saúde da bateria/i)).toBeVisible();
}

test.describe("Admin — battery_health", () => {
  test("edita, salva e persiste após reload", async ({ page }) => {
    await login(page);
    await openFirstProduct(page);

    const batteryInput = page.locator('input[type="number"][max="100"]');
    await expect(batteryInput).toBeVisible();

    // Valor inicial (para saber contra o que comparar após reload)
    const initial = await batteryInput.inputValue();

    // Novo valor determinístico e diferente do atual
    const target = initial === "82" ? "73" : "82";
    await batteryInput.fill(target);
    await expect(batteryInput).toHaveValue(target);

    // Salvar
    await page.getByRole("button", { name: /^salvar$/i }).click();

    // Confirmação (toast) e Sheet fecha
    await expect(page.getByText(/atualizado/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/saúde da bateria/i)).toBeHidden({ timeout: 10_000 });

    // Reload da página inteira
    await page.reload();
    await expect(page.getByRole("heading", { name: /produtos e serviços/i })).toBeVisible();

    // Reabre o mesmo produto (primeiro com badge "Produto")
    await openFirstProduct(page);

    const batteryInputAfter = page.locator('input[type="number"][max="100"]');
    await expect(batteryInputAfter).toHaveValue(target);
  });
});
