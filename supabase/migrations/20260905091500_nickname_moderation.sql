/*
  # Takma ad denetimi (hafif sürüm)

  Lider tablosu HERKESE AÇIK -- takma ad alanı hiç denetlenmeden
  yayınlanıyordu. Afsar Gym Lab'da tam bu yüzden kapsamlı bir isim
  denetim sistemi kurmuştuk (nameBlocklist.json, Unicode kaçış yolları
  dahil); burada aynı ölçekte bir sistem kurmak bu projenin boyutuna göre
  aşırı olur, ama SIFIR denetim de kabul edilemez -- ikisinin ortası:
  sunucu tarafında (istemci atlanamaz) küçük ama gerçek bir engel listesi.

  Bilerek TETİKLEYİCİDE (trigger), istemcide değil: anon anahtar herkese
  açık olduğu için, istemci kontrolü doğrudan REST çağrısı yapan biri
  tarafından hiç çalıştırılmadan atlanabilir.

  Kaçış yollarına (leetspeak, boşluk arası harf vb.) karşı tam koruma
  YOK -- bu bilinçli bir kapsam sınırı, Afsar Gym Lab'daki gibi tam
  dayanıklı bir sistem gerekirse oradaki nameBlocklist.json yaklaşımı
  buraya da taşınabilir.
*/

CREATE OR REPLACE FUNCTION public.moderate_nickname()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  banned text[] := ARRAY[
    'amk','aq','sik','sikik','yarrak','piç','pic','oç','oc','ibne',
    'orospu','götveren','gotveren','amcık','amcik','sikeyim','siktir',
    'fuck','shit','bitch','asshole','nigger','cunt','rape','porn'
  ];
  term text;
BEGIN
  normalized := lower(regexp_replace(NEW.nickname, '[^a-zA-Z0-9şŞçÇğĞıİöÖüÜ]', '', 'g'));
  FOREACH term IN ARRAY banned LOOP
    IF normalized LIKE '%' || term || '%' THEN
      RAISE EXCEPTION 'nickname_not_allowed';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moderate_nickname_trigger ON public.leaderboard;
CREATE TRIGGER moderate_nickname_trigger
  BEFORE INSERT OR UPDATE OF nickname ON public.leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.moderate_nickname();
