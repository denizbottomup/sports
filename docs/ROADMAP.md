# Touchline iş planı

## Şimdi: Galatasaray ile gerçek veri

- Varsayılan takım Galatasaray; ilk kullanım bu takımın yaklaşan rakibini açar.
- Lig ve Avrupa maçlarını birlikte sıralama, saatleri Türkiye saatinde gösterme.
- Rakibin resmî açıklamaları ve Türkçe basın başlıkları; kaynak, yayın ve kontrol zamanları.
- Sunucuda periyodik veri toplama; açık sayfalara SSE ile yeni haber iletimi.
- Gerçek kulüp logoları, resmî kaynaklardan oyuncu ve haber görselleri.
- Kaynak arızalarında son başarılı veriyi tarihiyle gösterme; eksik veriden sonuç üretmeme.

## Sonraki: Kullanıcı hesabı ve takım seçimi

- [x] Google ile giriş, çıkış ve 30 günlük oturum (httpOnly çerez).
- [x] İlk girişte takım arama → favori takım seçimi → en fazla 5 takımlık takip listesi.
- [x] Takım tercihini hesapta saklama, cihazlar arasında eşitleme ve kenar çubuğundan değiştirme.
- [ ] Bildirim tercihleri.
- [ ] Kaydedilen haberleri ve okuma durumunu kullanıcı hesabına bağlama (şimdilik tarayıcıda).
- [ ] Hesap silme ve oturumların toplu kapatılması.

## Veri kapsamının genişletilmesi

- [x] Takım dizini: Türkiye + İngiltere, İspanya, Almanya, İtalya, Fransa ve Portekiz kulüpleri (ESPN lig listeleri); fikstür/kadro/basın dizini bu takımlar için dinamik toplanır.
- [ ] Her kulüp için resmî kaynak kaydının genişletilmesi (`server/registry.js`); bugün Galatasaray ve Sporting CP kayıtlı.
- Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi ve ön elemeler.
- Branş ayrımı ve kulüp başına kaynak sağlık takibinin genişletilmesi.
- Lisanslı fikstür/kadro servisi, müsabakaya özel sakatlık/ceza doğrulaması.
- Kaynak bazında gecikme ölçümü, haber tekrarlarını birleştirme, Türkçe çeviri.

## Taraftar nabzı

- X ve YouTube erişimi, platform bazında gerçek örneklem ve kaynak bağlantıları.
- Maça güven, teknik direktöre destek ve oyuncu memnuniyetini ayrı ölçme.
- Örneklem azsa skor göstermeme; model doğruluğunu etiketli yorumlarla ölçme.
- Yeni haberin gösterimi sentiment işlemesini beklememeli.

## Bildirimler

- Web push ve kullanıcının seçtiği takım için abonelik.
- Kullanıcının belirlediği sessiz saatler ve bildirim türleri.
- Haber sisteme giriş → tarayıcıya iletim ve kaynak yayın → keşif gecikmelerini ayrı ölçme.

## Haber okuma ve maç künyesi

- [x] Kaynak adıyla uygulama içinde haber okuyucu; seçili kaynak kontrollü Türkçe özetler.
- [x] Clickbait/saat/kanal/bilet filtreleri ve metinsiz başlıkların elenmesi.
- [x] Cihaz saat dilimi, yaz/kış saati ve yayın ülkesi ayrımı.
- [x] Kaynak ve kontrol tarihiyle maç hakemi / yayıncı / erişim durumu.
- [ ] Tüm kaynaklar için otomatik, olgu denetimli çok dilli özet üretimi; metin erişimi olmayan basın kaynakları için izinli içerik anlaşmaları.
- [ ] Ülke bazında kapsamlı yayın/abonelik verisi; federasyon hakem kaynakları ve editöryal inceleme kuyruğu.
