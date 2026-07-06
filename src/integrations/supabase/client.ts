import { createClient } from "@supabase/supabase-js";

// Chaves publishable (podem ficar no código do frontend)
const SUPABASE_URL = "https://otjajtfaqzpkhbwjdiow.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90amFqdGZhcXpwa2hid2pkaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzQwOTksImV4cCI6MjA5ODk1MDA5OX0.9Uac8GidcbRGyzOYZz-nkD8xzX_vx10nwKhJPJ6N6cc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
