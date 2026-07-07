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

  test("trade-in monta wa.me com marca/modelo/estimativa", async ({ page }) => {
    // Intercepta a navegação para wa.me antes que aconteça (não temos rede real).
    let capturado = "";
    await page.route("https://wa.me/**", async (route) => {
      capturado = route.request().url();
      await route.fulfill({ status: 200, body: "ok" });
    });

    await page.goto("/trade-in?cidade=rio-negrinho&origem=teste");
    await page.getByPlaceholder(/iPhone 13 128GB/i).fill("iPhone 13 128GB");
    await page.getByPlaceholder(/^90$/).fill("90");
    const nome = page.locator('input[maxlength="80"]').last();
    await nome.fill("Teste QA");
    const tel = page.locator('input[maxlength="20"]');
    await tel.fill("47999999999");

    await page.getByRole("button", { name: /falar no whatsapp/i }).click();
    // Aguarda até 5s pela navegação para wa.me
    await expect.poll(() => capturado, { timeout: 5000 }).toMatch(/wa\.me\/5547996801247/);

    const decoded = decodeURIComponent(capturado);
    expect(decoded).toContain("iPhone 13");
    expect(decoded).toContain("Trade-in");
  });
});
