import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke E2E — valida rotas públicas críticas + link WhatsApp com params.
 *
 * Roda sem autenticação. Todas as rotas devem responder 200 e exibir
 * elementos-chave (H1, formulário, etc.).
 *
 * Execução:
 *   bunx playwright test e2e/smoke.spec.ts
 */

const ROTAS_PUBLICAS: Array<{ path: string; heading: RegExp }> = [
  { path: "/", heading: /glass phone|iphone|celular/i },
  { path: "/loja", heading: /loja|produtos|celulares/i },
  { path: "/trade-in", heading: /quanto vale/i },
  { path: "/comparar", heading: /comparar/i },
  { path: "/em/sao-bento-do-sul", heading: /são bento do sul/i },
  { path: "/em/rio-negrinho", heading: /rio negrinho/i },
  { path: "/em/mafra", heading: /mafra/i },
];

test.describe("Smoke — rotas públicas", () => {
  for (const r of ROTAS_PUBLICAS) {
    test(`GET ${r.path} renderiza sem erros`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => consoleErrors.push(String(e)));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const resp = await page.goto(r.path, { waitUntil: "domcontentloaded" });
      expect(resp?.status(), `status de ${r.path}`).toBeLessThan(400);

      // H1 deve existir e conter texto esperado
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1").first()).toContainText(r.heading);

      // Sem erros de JS no console (ignora warnings/log)
      const graves = consoleErrors.filter(
        (m) => !/favicon|sourcemap|Download the React DevTools/i.test(m),
      );
      expect(graves, `console errors em ${r.path}: ${graves.join("\n")}`).toEqual([]);
    });
  }
});

test.describe("Smoke — WhatsApp deep-links", () => {
  test("hero de /em/$cidade abre wa.me com número correto", async ({ page }: { page: Page }) => {
    await page.goto("/em/sao-bento-do-sul");
    const waLink = page.locator('a[href*="wa.me/5547996801247"]').first();
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/5547996801247\?text=/);
    // Mensagem deve mencionar a cidade
    expect(decodeURIComponent(href!)).toContain("São Bento do Sul");
  });

  test("float button aponta para wa.me", async ({ page }) => {
    await page.goto("/");
    const float = page.locator('a[aria-label*="WhatsApp"]').last();
    await expect(float).toBeVisible();
    const href = await float.getAttribute("href");
    expect(href).toMatch(/wa\.me\/5547996801247/);
  });

  test("trade-in monta wa.me com marca/modelo/estimativa", async ({ page }) => {
    await page.goto("/trade-in?cidade=rio-negrinho&origem=teste");
    await page.getByLabel(/modelo/i).fill("iPhone 13 128GB");
    await page.getByLabel(/saúde da bateria/i).fill("90");
    await page.getByLabel(/seu nome/i).fill("Teste QA");
    await page.getByLabel(/telefone/i).fill("47999999999");

    // Intercepta a navegação para wa.me
    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().startsWith("https://wa.me/")).catch(() => null),
      page.getByRole("button", { name: /falar no whatsapp/i }).click(),
    ]);

    // Fallback: se não interceptou request, checa URL atual
    const targetUrl = request?.url() ?? page.url();
    expect(targetUrl).toMatch(/wa\.me\/5547996801247/);
    const decoded = decodeURIComponent(targetUrl);
    expect(decoded).toContain("iPhone 13");
    expect(decoded).toContain("Trade-in");
  });
});
