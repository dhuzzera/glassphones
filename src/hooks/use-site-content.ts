import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============ Types ============
export type SiteSettings = Record<string, string>;

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

// ============ Fallbacks (valores originais do código) ============
const SETTINGS_FALLBACK: SiteSettings = {
  "contact.phone_display": "(47) 9680-1247",
  "contact.whatsapp_number": "5547996801247",
  "contact.whatsapp_url": "https://api.whatsapp.com/message/L6DTBZKAUP67J1?autoload=1&app_absent=0",
  "contact.instagram": "https://www.instagram.com/glass_phonesbs/",
  "contact.email": "",
  "contact.address_line1": "Av. São Bento, 1330 — Sala 8",
  "contact.address_line2": "São Bento do Sul/SC · 89281-100",
  "contact.hours": "Seg-Sáb 9h às 19h",
  "topbar.shipping": "Entrega para todo o Brasil",
  "topbar.payment": "Até 12x sem juros no cartão",
  "footer.tagline": "Smartphones, acessórios e assistência com atendimento humano.",
};

// ============ site_settings ============
export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: SiteSettings = { ...SETTINGS_FALLBACK };
      for (const row of data ?? []) {
        const v = (row as { key: string; value: unknown }).value;
        map[(row as { key: string }).key] = typeof v === "string" ? v : String(v ?? "");
      }
      return map;
    },
    staleTime: 60_000,
  });

  const settings = query.data ?? SETTINGS_FALLBACK;
  const get = (key: string, fallback = "") => settings[key] ?? fallback;
  return { settings, get, isLoading: query.isLoading };
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_settings"] }),
  });
}

// ============ faq_items ============
export function useFaqItems() {
  return useQuery({
    queryKey: ["faq_items"],
    queryFn: async (): Promise<FaqItem[]> => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FaqItem[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertFaqItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<FaqItem> & { question: string; answer: string }) => {
      const payload = {
        ...item,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("faq_items").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq_items"] }),
  });
}

export function useDeleteFaqItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faq_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq_items"] }),
  });
}

// ============ payment_methods ============
export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PaymentMethod[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<PaymentMethod> & { name: string }) => {
      const { error } = await supabase
        .from("payment_methods")
        .upsert({ ...item, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment_methods"] }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment_methods"] }),
  });
}

// ============ Upload de imagem para o bucket site-images ============
export async function uploadSiteImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("site-images").getPublicUrl(path);
  return data.publicUrl;
}
