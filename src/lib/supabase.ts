import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ayrı bir Supabase projesi -- Afsar Gym Lab'ınkiyle hiçbir ilişkisi yok,
 * kasıtlı olarak (bkz. README). Kimlik doğrulama tamamen ANONİM: hesap
 * sistemi yok, sadece cihaz başına bir auth.users satırı (bkz. leaderboard.ts).
 *
 * İSTEMCİ TEMBEL YÜKLENİYOR (dinamik import). Sebep: @supabase/supabase-js
 * ana paketin en büyük tek parçası ve içinde oyunun HİÇ kullanmadığı
 * realtime (websocket) istemcisi de var. Oysa lider tablosu tamamen isteğe
 * bağlı -- takma ad girmemiş bir oyuncu ona hiç dokunmuyor.
 *
 * Modül seviyesinde `createClient` çağırmak, oyunu açan HERKESE bu yükü
 * indirtiyordu. Artık ilk gerçek lider tablosu işleminde iniyor; katılmayan
 * oyuncu hiç indirmiyor. (leaderboard.ts'teki submitScore, takma ad
 * kontrolünü istemciyi istemeden ÖNCE yapıyor -- sıra bu yüzden önemli.)
 */
let istemci: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  istemci ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    ),
  );
  return istemci;
}
