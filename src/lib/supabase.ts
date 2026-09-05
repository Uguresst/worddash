import { createClient } from '@supabase/supabase-js';

/**
 * Ayrı bir Supabase projesi -- Afsar Gym Lab'ınkiyle hiçbir ilişkisi yok,
 * kasıtlı olarak (bkz. README). Kimlik doğrulama tamamen ANONİM: hesap
 * sistemi yok, sadece cihaz başına bir auth.users satırı (bkz. leaderboard.ts).
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);
