# Touchline — maç öncesi rakip dosyası

Galatasaray'ın sıradaki lig ve Avrupa rakibi için gerçek fikstür, haberler ve kulüp kadrosunu bir araya getiren web uygulaması.

## Mevcut sürüm

- Galatasaray'ın yaklaşan maçları ESPN fikstür kaynağından alınır; sıradaki maç tarihe göre belirlenir.
- Sıradaki lig ve Avrupa rakibinin haberleri resmî kulüp kaynakları ve Google News RSS üzerinden toplanır. Kaynak ve yayın tarihi gösterilir.
- Sporting CP kadrosu ve oyuncu fotoğrafları resmî kulüp sitesinden alınır. Diğer rakipler için ESPN kadro verisi kullanılır; olmayan fotoğraf üretilmez.
- Kulüp logoları ve kaynak görselleri sunucuda önbelleğe alınır.
- Kaynaklar 30–60 saniyelik haber, 15 dakikalık fikstür ve 4 saatlik kadro aralıklarıyla kontrol edilir. Yeni veriler açık tarayıcıya SSE ile iletilir; yayıncı gecikmesi bu sürelere dahil değildir.
- Haber arama, filtreleme, ayrıntılar ve tarayıcıda haber kaydetme çalışır.

Taraftar sentimenti henüz bağlı değildir; örnek yüzdeler gösterilmez. Kullanıcı hesabı ve takım seçimi [iş planındadır](docs/ROADMAP.md). Mevcut entegrasyon tüm liglerin tüm takımlarını kapsamaz. Haberler kaynak dilinde gösterilir. Kamuya açık kaynaklar değişebilir; uygulama kaynak sağlığını ve son başarılı kontrolü gösterir.

## Yerel çalıştırma

Node.js 22 ve npm gerekir. Depo kökünde:

```sh
npm ci
npm --prefix web ci
npm run build
npm start
```

Uygulama: http://localhost:3002. Geliştirme için backend çalışırken ayrı terminalde `npm --prefix web run dev` kullanılabilir.

```sh
npm test
```

Express API ve web çıktısını birlikte sunar. `DATA_DIR` (varsayılan `./data`) haber/fikstür anlık görüntüsünü ve görselleri saklar. Bu dizin Git'e eklenmez. Mevcut kaynaklar API anahtarı gerektirmez.

## Yayın ve ürün notları

- [Railway dağıtımı](deploy/README.md)
- [İş planı](docs/ROADMAP.md)
- [Ürün kapsamı](docs/SPORTS_PRODUCT_BRIEF.md)
- [Veri kaynakları araştırması](docs/SPORTS_DATA_RESEARCH.md)
- [Taraftar nabzı yaklaşımı](docs/SPORTS_FAN_PULSE.md)

Araştırma notlarındaki hedefler uygulanmış özellikler değildir.
