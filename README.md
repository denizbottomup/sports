# Touchline — maç öncesi rakip dosyası

Seçtiğin takımın sıradaki lig ve Avrupa rakibi için gerçek fikstür, haberler ve kulüp kadrosunu bir araya getiren web uygulaması.

## Mevcut sürüm

- Google ile giriş zorunludur. İlk girişte favori takım seçilir; en fazla 5 takımlık ayrı bir takip listesi tutulabilir. Tercihler sunucuda hesapta saklanır.
- Takım dizini ESPN lig listelerinden gelir: Süper Lig, Premier League, LaLiga, Bundesliga, Serie A, Ligue 1 ve Primeira Liga. Rakip dosyası favori takım için hazırlanır; takip listesindeki takımların fikstürü ve haberleri akışa eklenir.
- Favori takımın yaklaşan maçları ESPN fikstür kaynağından alınır; sıradaki maç tarihe göre belirlenir.
- Sıradaki lig ve Avrupa rakibinin haberleri resmî kulüp kaynakları ve Google News RSS üzerinden toplanır. Kaynak ve yayın tarihi gösterilir.
- Resmî kaynak kaydı olan kulüplerde (şimdilik Galatasaray ve Sporting CP, `server/registry.js`) kulüp sitesi/RSS akışı kullanılır; kadro ve oyuncu fotoğrafları resmî siteden gelir. Kayıtsız kulüplerde ESPN kadro verisi ve Türkçe basın dizini kullanılır; olmayan fotoğraf üretilmez. Resmî akışı bağlı olmayan takımlarda okunabilir metin şartı nedeniyle haber akışı ince kalabilir; kapsam kayıt defteri genişledikçe artar.
- Kulüp logoları ve kaynak görselleri sunucuda önbelleğe alınır.
- Kaynaklar 30–60 saniyelik haber, 15 dakikalık fikstür ve 4 saatlik kadro aralıklarıyla kontrol edilir. Yeni veriler açık tarayıcıya SSE ile iletilir; yayıncı gecikmesi bu sürelere dahil değildir.
- Haberler uygulama içindeki okuyucuda açılır; kaynak adı korunur. Seçili Sporting haberlerinde kaynak kontrolü yapılmış Türkçe özetler, diğer uygun resmî haberlerde kısa kaynak aktarımları gösterilir. Tam makaleler yeniden yayımlanmaz.
- Clickbait, saat/kanal soruları ve bilet içerikleri akıştan elenir. Okunabilir metni olmayan dizin başlıkları gösterilmez; aynı başlıklı haberler tekilleştirilir. Filtre kural tabanlıdır; tüm diller için eksiksiz sınıflandırma değildir.
- Maç künyesi cihazın saat dilimini, stadyumu, hakemi ve seçilen ülkenin doğrulanmış yayın bilgisini gösterir. Yayın ülkesi saat diliminden ayrı seçilir. Türkiye TRT duyurusu ve ESPN bölgesel verisi bağlıdır; bilinmeyen yayıncı/şifre alanları tahmin edilmez.
- Haber arama, filtreleme, ayrıntılar ve tarayıcıda haber kaydetme çalışır.

Taraftar sentimenti henüz bağlı değildir; örnek yüzdeler gösterilmez. Kullanıcı hesabı ve takım seçimi çalışır durumdadır; ayrıntılar [iş planındadır](docs/ROADMAP.md). Mevcut entegrasyon tüm liglerin tüm takımlarını kapsamaz. Türkçe özet ile kaynak dilindeki kısa aktarım ayrı etiketlenir. Kamuya açık kaynaklar değişebilir; uygulama kaynak sağlığını ve son başarılı kontrolü gösterir.

## Yerel çalıştırma

Node.js 22 ve npm gerekir. Depo kökünde:

```sh
npm ci
npm --prefix web ci
npm run build
npm start
```

Uygulama: http://localhost:3002. Geliştirme için backend çalışırken ayrı terminalde `npm --prefix web run dev` kullanılabilir.

Google girişi için bir OAuth istemcisi gerekir: Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Authorized JavaScript origins alanına yerelde `http://localhost:3002` (ve varsa `http://localhost:5173`), canlıda uygulamanın adresi eklenir. Alınan istemci kimliği sunucuya `GOOGLE_CLIENT_ID` ortam değişkeni olarak verilir; client secret gerekmez. `GOOGLE_CLIENT_ID` tanımlı değilse uygulama giriş ekranında yapılandırma uyarısı gösterir.

```sh
npm test
```

Express API ve web çıktısını birlikte sunar. `DATA_DIR` (varsayılan `./data`) haber/fikstür anlık görüntüsünü, kullanıcı hesaplarını (`users.json`), takım dizinini (`teams.json`) ve görselleri saklar. Bu dizin Git'e eklenmez. Mevcut veri kaynakları API anahtarı gerektirmez; tek zorunlu secret `GOOGLE_CLIENT_ID`'dir.

## Yayın ve ürün notları

- [Railway dağıtımı](deploy/README.md)
- [İş planı](docs/ROADMAP.md)
- [Ürün kapsamı](docs/SPORTS_PRODUCT_BRIEF.md)
- [Veri kaynakları araştırması](docs/SPORTS_DATA_RESEARCH.md)
- [Taraftar nabzı yaklaşımı](docs/SPORTS_FAN_PULSE.md)

Araştırma notlarındaki hedefler uygulanmış özellikler değildir.
