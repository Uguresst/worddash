/*
  # Lider tablosu (rekabet)

  1. Amaç
     Cihazlar arası karşılaştırılabilir, herkese açık bir skor tablosu.
     Hesap sistemi hâlâ yok (bilerek) -- Supabase'in ANONİM oturum açma
     özelliği kullanılıyor: kullanıcı e-posta/şifre girmiyor, cihaz ilk
     açılışta arka planda otomatik bir auth.users satırı alıyor
     (`supabase.auth.signInAnonymously()`), sadece bir takma ad soruluyor.

  2. leaderboard tablosu
     id = auth.uid() (anonim oturumun kendi kimliği). nickname, en iyi
     seviye, toplam jeton ve en iyi seri tutuluyor -- ham e-posta/isim gibi
     kişisel veri hiç yok, zaten anonim oturumların böyle bir verisi de yok.

  3. RLS
     - Herkes HERKESİN satırını okuyabilir (lider tablosu gereği bu şart).
     - Kimse SADECE KENDİ satırını yazabilir/güncelleyebilir
       (auth.uid() = id kontrolü).

  4. ÖNEMLİ -- elle yapılması gereken ayar (bu SQL'in kapsamı dışında)
     Supabase Dashboard -> Authentication -> Sign In / Providers ->
     "Anonymous Sign-Ins" AÇIK olmalı. Bu bir Auth sağlayıcı ayarı,
     SQL ile açılamıyor -- proje varsayılanında KAPALI gelir.
*/

CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(trim(nickname)) BETWEEN 1 AND 20),
  best_level integer NOT NULL DEFAULT 0,
  total_coins integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_leaderboard" ON public.leaderboard;
CREATE POLICY "select_all_leaderboard" ON public.leaderboard FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_leaderboard_row" ON public.leaderboard;
CREATE POLICY "insert_own_leaderboard_row" ON public.leaderboard FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_leaderboard_row" ON public.leaderboard;
CREATE POLICY "update_own_leaderboard_row" ON public.leaderboard FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Lider tablosu "en iyi seviye"ye göre siralanacak -- indeks bu sorguyu hizlandirir.
CREATE INDEX IF NOT EXISTS leaderboard_best_level_idx ON public.leaderboard (best_level DESC);
