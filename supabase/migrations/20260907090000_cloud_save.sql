/*
  # Yedekleme ve kurtarma kodu

  1. Çözdüğü sorun
     İlerleme yalnızca localStorage'da duruyordu (`worddash_state_v2`).
     Tarayıcı verisini silen, uygulamayı kaldırıp yeniden kuran ya da
     telefon değiştiren oyuncu 300 kelimelik dağarcığını ve bütün
     seviyelerini kaybediyordu. Bu, oyunun en çok emek isteyen kısmının
     tek bir "site verilerini temizle" dokunuşuyla yok olması demek.

  2. Neden hesap yok
     Uygulamanın vaadi "kayıt yok, e-posta yok, şifre yok" ve mağaza
     metni bunu söylüyor. O yüzden kurtarma bir HESAPLA değil, oyuncunun
     bir yere not ettiği KURTARMA KODUYLA yapılıyor. Lider tablosundaki
     anonim oturum burada da kullanılıyor (auth.uid()).

  3. Kod düz metin olarak SAKLANMIYOR
     Yalnızca SHA-256 özeti tutuluyor. Veritabanı bir şekilde sızarsa
     elde edilen şey çalışan kod listesi değil, özet listesi olur.
     Karşılaştırmayı `claim_save` yapıyor: düz kodu alıyor, özetliyor,
     satırı öyle buluyor.

  4. RLS
     Kayıt SATIRI ÖZELDIR -- lider tablosunun aksine kimse başkasının
     satırını okuyamaz. Kurtarma bu yüzden RLS'i bilerek atlayan bir
     SECURITY DEFINER fonksiyonundan geçiyor; tek anahtarı kodun kendisi.

  5. Kurtarma sahiplik DEVRETMİYOR
     `claim_save` yalnızca durumu okuyup döndürüyor. Yeni cihaz kendi
     anonim kimliğiyle kendi satırını açıyor. Böylece kod bilen biri
     başkasının satırını ele geçiremiyor, eski cihaz da çalışmaya devam
     ediyor.

  6. ÖNEMLİ -- elle yapılması gereken ayar
     Supabase Dashboard -> Authentication -> Sign In / Providers ->
     "Anonymous Sign-Ins" AÇIK olmalı (lider tablosu için zaten gerekli).
*/

CREATE TABLE IF NOT EXISTS public.saves (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  /* Kurtarma kodunun SHA-256 özeti (onaltılık). Benzersiz: iki oyuncunun
     aynı koda düşmesi 60 bitlik kodda pratikte imkânsız, ama çakışma
     olursa sessizce yanlış kaydı vermek yerine yazma hatası versin. */
  code_hash text NOT NULL UNIQUE CHECK (char_length(code_hash) = 64),
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

/* Lider tablosundan farklı olarak HERKESE AÇIK SELECT YOK. */
DROP POLICY IF EXISTS "select_own_save" ON public.saves;
CREATE POLICY "select_own_save" ON public.saves FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_save" ON public.saves;
CREATE POLICY "insert_own_save" ON public.saves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_save" ON public.saves;
CREATE POLICY "update_own_save" ON public.saves FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

/* Oyuncu yedeklemeyi kapatabilmeli -- "veriyi sil" hakkı Play Store
   şartı ve gizlilik politikasında da söz verildi. */
DROP POLICY IF EXISTS "delete_own_save" ON public.saves;
CREATE POLICY "delete_own_save" ON public.saves FOR DELETE
  TO authenticated USING (auth.uid() = id);

/*
  Yedeği yaz/güncelle. Özetleme TEK YERDE, burada: istemcide de
  hesaplansaydı iki ayrı SHA-256 uygulamasının sonsuza dek aynı sonucu
  vermesine güvenmek gerekirdi.

  SECURITY INVOKER (varsayılan): çağıran kullanıcı olarak çalışıyor,
  yani yukarıdaki RLS politikaları geçerli ve kimse başkasının satırına
  yazamıyor.
*/
CREATE OR REPLACE FUNCTION public.push_save(p_code text, p_state jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'oturum yok';
  END IF;
  IF p_code IS NULL OR char_length(p_code) < 8 THEN
    RAISE EXCEPTION 'gecersiz kod';
  END IF;

  v_hash := encode(sha256(convert_to(upper(p_code), 'UTF8')), 'hex');

  INSERT INTO public.saves (id, code_hash, state, updated_at)
  VALUES (auth.uid(), v_hash, p_state, now())
  ON CONFLICT (id) DO UPDATE
    SET code_hash = EXCLUDED.code_hash,
        state = EXCLUDED.state,
        updated_at = now();
END;
$$;

/*
  Kodu bilen cihaza kaydı ver.

  SECURITY DEFINER, çünkü kurtaran cihaz o satırın sahibi DEĞİL -- RLS
  altında satırı hiç göremezdi. Fonksiyonun tek yaptığı şey özeti eşleşen
  satırın `state` alanını döndürmek: sahiplik devretmiyor, satırı
  değiştirmiyor, kimin satırı olduğunu (id) söylemiyor.

  Kaba kuvvet: kod 60 bit (12 karakter, 32 harfli alfabe). Saniyede bin
  deneme yapan biri bile ortalama milyonlarca yıl uğraşır; ayrıca
  Supabase'in kendi hız sınırı da devrede.
*/
CREATE OR REPLACE FUNCTION public.claim_save(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state jsonb;
BEGIN
  IF p_code IS NULL OR char_length(p_code) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT state INTO v_state
  FROM public.saves
  WHERE code_hash = encode(sha256(convert_to(upper(p_code), 'UTF8')), 'hex');

  RETURN v_state; -- bulunamazsa NULL
END;
$$;

REVOKE ALL ON FUNCTION public.claim_save(text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_save(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_save(text, jsonb) TO authenticated;
