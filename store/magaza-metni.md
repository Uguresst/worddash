# Play Console — mağaza metinleri ve başvuru kontrol listesi

Bu dosyadaki metinler Play Console'a **kopyala-yapıştır** hazırdır. Karakter
sınırları Google'ın kabul ettiği üst sınırlardır; aşarsan alan kaydedilmez.

---

## 1. Uygulama adı (en fazla 30 karakter)

```
WordDash — Kelime Tekerleği
```

*(27 karakter. İngilizce mağaza dili için: `WordDash — Word Wheel` — 21 karakter.)*

## 2. Kısa açıklama (en fazla 80 karakter)

```
Harf tekerleğinden İngilizce kelimeler kur, Türkçe ipuçlarıyla öğren.
```

*(69 karakter. EN: `Build English words on a letter wheel and learn them as you play.` — 64)*

## 3. Tam açıklama (en fazla 4000 karakter)

```
Harfler bir tekerlek üzerinde duruyor. Parmağını sürükleyip kelimeyi kur.
Türkçe ipucu ekranda: "kelebek" yazıyorsa senden beklenen BUTTERFLY.

WordDash bir bulmaca oyunu gibi oynanır ama arkasında gerçek bir kelime
dağarcığı çalışması var: 18 konu paketinde 1.293 İngilizce kelime, her biri
Türkçe karşılığıyla.

▸ KONU KONU İLERLE
Temel kelimelerden başlıyorsun; yiyecek, hayvanlar, ev eşyaları, vücut,
aile, giyim, doğa, şehir, seyahat, okul, meslekler, zaman, spor, teknoloji,
duygular, fiiller ve sıfatlarla devam ediyor. Her paket bitince yenisi
açılıyor ve haritada nerede olduğunu her an görüyorsun.

▸ İLGİLİ KELİMELER BİR ARADA
Rastgele kelimeler yerine aynı konudan kelimeler art arda geliyor. Dil
öğreniminde en çok işe yarayan yöntem bu: "havuç, lahana, marul" birbirini
hatırlatır, birbirinden kopuk kelimeler hatırlatmaz.

▸ İPUCUNU KAPATABİLİRSİN
Türkçe ipucu varsayılan olarak açık — oyun bir çeviri alıştırmasına
dönüşüyor. Kapattığında saf anagram bulmacasına dönüyor. İkisi de tek
dokunuş uzağında.

▸ SERİNİ KORU
Art arda ipucu kullanmadan bildiğin her kelime seriyi büyütüyor, seri
büyüdükçe kazandığın jeton katlanıyor. Bir kelimede iki kez yanılırsan seri
kırılıyor — ama Seri Kalkanı aldıysan o hakkı kullanıyorsun.

▸ JETON, SANDIK VE TEMALAR
Her doğru cevap jeton kazandırıyor. Jetonla Seri Kalkanı, Atlama Jokeri ve
7 farklı görsel tema alabiliyorsun. Her 5 doğru cevapta bir ücretsiz sandık
açılıyor; içinden jeton, güçlendirme ya da nadiren bir tema çıkıyor.

▸ TEKRAR ETMEDEN ÖĞRENİLMEZ
Bir kelimeyi bir kez bilmek onu öğrenmek değil. Çözdüğün kelimeler artan
aralıklarla (1, 3, 7, 16, 35 gün) karşına yeniden çıkıyor; bilemediklerin
ertesi gün geri geliyor. Beş tekrarı geçen kelime "öğrenildi" oluyor.

▸ KELİME DAĞARCIĞIN BİRİKİYOR
Çözdüğün her kelime listende kalıyor, her birinin kaç tekrardan geçtiğini
görüyorsun. Ne öğrendiğini görmek, ne kadar oynadığını görmekten daha
değerli.

▸ LİDER TABLOSU (isteğe bağlı)
İstersen bir takma ad girip diğer oyuncularla yarışırsın. İstemezsen hiç
katılmazsın — oyunun tamamı zaten çevrimdışı çalışıyor.

▸ RAHATSIZ ETMEYEN BİR OYUN
Reklam yok. Uygulama içi satın alma yok. Kayıt yok, e-posta yok, şifre yok.
Can beklemek yok, oynamak için izin istemek yok. Aç ve oyna.

Lider tablosuna katılmadığın sürece uygulama hiçbir dış sunucuya bağlanmaz;
tamamen çevrimdışı oynanır.

Türkçe ve İngilizce arayüz desteği vardır.

Gizlilik politikası: https://worddash-seven.vercel.app/gizlilik.html
```

---

## 4. Kategori ve etiketler

| Alan | Değer |
|---|---|
| Uygulama türü | Oyun |
| Kategori | Kelime (Word) |
| Etiketler | kelime oyunu, İngilizce öğrenme, bulmaca, kelime dağarcığı |
| E-posta | uguresat0421@gmail.com |
| Gizlilik politikası | `https://<alan-adı>/gizlilik.html` |

## 5. Görseller (`store/` klasöründe hazır)

| Öğe | Dosya | Ölçü |
|---|---|---|
| Uygulama ikonu | `public/icons/icon-512.png` | 512×512 |
| Öne çıkan görsel | `store/one-cikan-gorsel-1024x500.png` | 1024×500 |
| Telefon ekran görüntüleri | `store/screenshots/1-5*.png` | 1080×1920 |

Yeniden üretmek için: `npm run build && npm run preview` (ayrı terminalde),
sonra `npm run store:assets`.

---

## 6. Veri güvenliği formu — VERİLECEK CEVAPLAR

Bu form **yanlış doldurulursa uygulama askıya alınabilir**, o yüzden
kodun gerçekte ne yaptığına göre yazıldı (`src/lib/leaderboard.ts`).

**Veri topluyor musunuz?** → **Evet** (yalnızca lider tablosuna katılan
kullanıcılardan).

| Veri türü | Toplanıyor | Paylaşılıyor | Zorunlu mu | Amaç |
|---|---|---|---|---|
| Kişisel bilgi → Kullanıcı kimlikleri (takma ad + anonim hesap kimliği) | Evet | Hayır | **İsteğe bağlı** | Uygulama işlevi |
| Uygulama etkinliği → Uygulama içi etkileşimler (seviye, jeton, seri) | Evet | Hayır | **İsteğe bağlı** | Uygulama işlevi |

Diğer tüm kategoriler (konum, kişiler, fotoğraf, dosya, sağlık, ödeme,
kişisel iletişim, cihaz kimliği, reklam kimliği): **Hayır.**

Ek sorular:
- Veriler aktarım sırasında şifreleniyor mu? → **Evet** (HTTPS)
- Kullanıcı verilerinin silinmesini talep edebilir mi? → **Evet**
  (uygulama içinde Rekabet → "Lider tablosundan ayrıl")
- Veriler üçüncü taraflarla paylaşılıyor mu? → **Hayır**
- Uygulamada reklam var mı? → **Hayır**

## 7. İçerik derecelendirme anketi — VERİLECEK CEVAPLAR

- Şiddet, korku, cinsellik, uyuşturucu, kumar, kötü dil → **Hayır** (hepsi)
- **Kullanıcılar birbiriyle etkileşebiliyor mu? → EVET.**
  Kullanıcı bir takma ad giriyor ve bu takma ad lider tablosunda diğer
  oyunculara görünüyor. Bunu "hayır" işaretlemek yanlış beyan olur.
  (Sunucu tarafında bir isim denetim tetikleyicisi var:
  `20260905091500_nickname_moderation.sql`.)
- Kullanıcılar konum paylaşıyor mu? → Hayır
- Dijital satın alma var mı? → Hayır

Beklenen sonuç: **3+ / Herkes**, "Kullanıcılar etkileşebilir" etiketiyle.

---

## 8. Yayına alma sırası

1. `npm run check` — hepsi temiz olmalı.
2. `npm run build && git push` — Vercel otomatik yayınlar.
3. **Supabase göçünü çalıştır:** `20260906090000_leaderboard_self_delete.sql`
   Dashboard → SQL Editor. Bu yapılmazsa "Lider tablosundan ayrıl" düğmesi
   sessizce başarısız olur ve veri silme beyanı YALAN olur.
4. Bubblewrap ile TWA paketle:
   ```
   npx @bubblewrap/cli init --manifest https://<alan-adı>/manifest.webmanifest
   npx @bubblewrap/cli build
   ```
5. Çıkan `.aab` dosyasını Play Console'a yükle (kapalı test kanalı).
6. Play App Signing sertifikasının SHA-256 parmak izini al, yerel
   anahtarınkiyle birlikte `public/.well-known/assetlinks.json` içine yaz,
   siteyi yeniden yayınla. (Ayrıntı: `public/.well-known/README.txt`)
7. `https://<alan-adı>/.well-known/assetlinks.json` erişilebilir mi doğrula.
8. Kapalı testte uygulamayı aç: **üstte Chrome adres çubuğu görünmemeli.**
   Görünüyorsa parmak izleri eşleşmiyordur.
9. Mağaza kaydını doldur (yukarıdaki metinler), formları gönder, incelemeye ver.

## 9. Yayından önce yapılacak temizlik

- Lider tablosundaki test satırını sil:
  ```sql
  DELETE FROM public.leaderboard WHERE nickname = 'test-otomatik';
  ```
