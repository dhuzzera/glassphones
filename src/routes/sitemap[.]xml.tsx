import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { servicos } from "@/lib/site";
import { CIDADES } from "@/lib/cidades";
import { slugify } from "@/lib/marketplace";

const BASE_URL = "https://glassphones.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/loja", changefreq: "weekly", priority: "0.95" },
          { path: "/servicos", changefreq: "monthly", priority: "0.9" },
          { path: "/comparar", changefreq: "weekly", priority: "0.85" },
          { path: "/trade-in", changefreq: "monthly", priority: "0.85" },
          { path: "/ofertas", changefreq: "weekly", priority: "0.9" },
          { path: "/avaliacoes", changefreq: "weekly", priority: "0.8" },
          { path: "/orcamento", changefreq: "monthly", priority: "0.8" },
          { path: "/faq", changefreq: "monthly", priority: "0.7" },
          { path: "/contato", changefreq: "yearly", priority: "0.7" },
          ...servicos.map<SitemapEntry>((s) => ({
            path: `/servicos/${s.slug}`,
            changefreq: "monthly",
            priority: "0.8",
          })),
          ...CIDADES.map<SitemapEntry>((c) => ({
            path: `/em/${c.slug}`,
            changefreq: "monthly",
            priority: "0.85",
          })),
        ];

        // Produtos ativos + combinações modelo/capacidade a partir das variantes
        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
            });
            const { data: products } = await sb
              .from("products")
              .select("slug, name, id")
              .eq("active", true)
              .eq("kind", "product");
            if (products?.length) {
              for (const p of products) {
                entries.push({
                  path: `/loja/${p.slug}`,
                  changefreq: "weekly",
                  priority: "0.85",
                });
              }
              const ids = products.map((p) => p.id);
              const { data: variants } = await sb
                .from("product_variants")
                .select("product_id, attributes")
                .in("product_id", ids)
                .eq("active", true);
              const seen = new Set<string>();
              for (const v of variants ?? []) {
                const cap = (v.attributes as Record<string, string> | null)?.["Capacidade"];
                if (!cap) continue;
                const prod = products.find((p) => p.id === v.product_id);
                if (!prod) continue;
                // extrai "iphone 13 pro" de "iPhone 13 Pro 128GB Preto"
                const modeloRaw = prod.name.replace(/\b\d+(GB|TB)\b/gi, "").trim();
                const slug = `${slugify(modeloRaw)}-${cap.toLowerCase()}`;
                if (seen.has(slug)) continue;
                seen.add(slug);
                entries.push({
                  path: `/celular/${slug}`,
                  changefreq: "weekly",
                  priority: "0.8",
                });
              }
            }
          }
        } catch {
          /* sitemap continua com as URLs estáticas mesmo se o Supabase falhar */
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
