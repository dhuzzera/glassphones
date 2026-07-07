import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke E2E — valida rotas públicas críticas + deep-links do WhatsApp.
 * Rodar com: bunx playwright test e2e/smoke.spec.ts
 */

const ROTAS_PUBLICAS: Array<{ path: string; heading: RegExp }> = [
  { path: "/", heading: /glass phone|iphone|celular|smartphone/i },
  { path: "/loja", heading: /./ }, // H1 vem do CMS — só valida que existe
  { path: "/trade-in", heading: /quanto vale/i },
  { path: "/comparar", heading: /compare|comparar/i },
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

      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(r.heading);

      const graves = consoleErrors.filter(
        (m) => !/favicon|sourcemap|Download the React DevTools|net::ERR_/i.test(m),
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
    expect(decodeURIComponent(href!)).toContain("São Bento do Sul");
  });

  test("float button aponta para whatsapp", async ({ page }) => {
    await page.goto("/");
    // O float pode usar wa.me OU um link customizado api.whatsapp.com vindo do CMS
    const float = page.locator('a[aria-label*="WhatsApp"]').last();
    await expect(float).toBeVisible();
    const href = await float.getAttribute("href");
    expect(href).toMatch(/whatsapp|wa\.me/i);
  });

  test("trade-in preenche form e mostra estimativa/CTA WhatsApp", async ({ page }) => {
    await page.goto("/trade-in?cidade=rio-negrinho&produto=iphone-15&origem=produto");
    await page.getByPlaceholder(/iPhone 13 128GB/i).fill("iPhone 13 128GB");
    // Botão WhatsApp existe e é clicável (não navegamos de fato — wa.me é externo)
    const cta = page.getByRole("button", { name: /falar no whatsapp/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
    // Query params de atribuição preservados na URL
    expect(page.url()).toContain("cidade=rio-negrinho");
    expect(page.url()).toContain("produto=iphone-15");
    expect(page.url()).toContain("origem=produto");
  });
});
