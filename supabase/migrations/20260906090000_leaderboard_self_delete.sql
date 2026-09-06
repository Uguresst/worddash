/*
  # Lider tablosu: kullanıcının kendi satırını silebilmesi

  1. Neden gerekli
     İlk lider tablosu göçünde SELECT/INSERT/UPDATE politikaları vardı ama
     DELETE yoktu. RLS açık bir tabloda politikası olmayan işlem varsayılan
     olarak REDDEDİLİR -- yani kullanıcı katıldıktan sonra lider tablosundan
     kendi satırını hiçbir şekilde silemiyordu.

     Bu yalnızca bir nezaket eksiği değil: Google Play, kullanıcının hesap
     oluşturabildiği uygulamalarda hem uygulama İÇİNDEN hem de web üzerinden
     ulaşılabilir bir veri silme yolu şart koşuyor. WordDash anonim de olsa
     bir auth.users satırı yaratıyor (bkz. leaderboard.ts ensureSession),
     dolayısıyla bu kapsama giriyor. Politika olmadan mağaza incelemesi
     bunu doğrudan ret sebebi sayar.

  2. Ne yapıyor
     Yalnızca `auth.uid() = id` olan satır silinebiliyor -- yani herkes
     sadece kendi skorunu silebilir, başkasınınkine dokunamaz. Okuma
     politikası (herkes herkesi görür) değişmiyor.

  3. Silmenin geri kalanı istemcide
     leaderboard.ts içindeki deleteMyScore() önce satırı siler, sonra
     oturumu kapatır. Oturum kapanınca cihaz bir daha aynı anonim kimliğe
     dönemez, yani silinen satır gerçekten geri gelmez.
*/

DROP POLICY IF EXISTS "delete_own_leaderboard_row" ON public.leaderboard;
CREATE POLICY "delete_own_leaderboard_row" ON public.leaderboard FOR DELETE
  TO authenticated USING (auth.uid() = id);
