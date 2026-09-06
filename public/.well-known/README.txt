assetlinks.json -- Android TWA (Trusted Web Activity) domain dogrulamasi.

Bu dosya, Play Store'daki Android uygulamasinin bu siteyi TARAYICI ADRES
CUBUGU OLMADAN acmasina izin verir. Parmak izleri eslesmezse uygulama
acilir ama ustte bir Chrome adres cubugu gorunur -- yani "web sitesi"
gibi durur, uygulama gibi degil.

IKI parmak izi de gerekli:

1) Play App Signing sertifikasi (ASIL OLAN)
   Play Console -> Uygulama -> Test ve yayinlama -> Uygulama imzalama
   -> "Uygulama imzalama anahtari sertifikasi" -> SHA-256 parmak izi.
   Bu deger ILK AAB YUKLENDIKTEN SONRA olusur; onceden bilinemez.

2) Yerel imzalama anahtari (Bubblewrap'in urettigi android.keystore)
   keytool -list -v -keystore android.keystore -alias android

Iki degeri de yukaridaki dizide yerlerine yazip siteyi yeniden yayinla,
sonra sunu dogrula:
   https://<alan-adi>/.well-known/assetlinks.json

Google'in dogrulayicisi:
   https://developers.google.com/digital-asset-links/tools/generator
