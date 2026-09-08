# Touchline — maç öncesi rakip dosyası

Seçtiğin takımın lig ve Avrupa maçları öncesinde rakiple ilgili haberleri, kadro gelişmelerini ve taraftar nabzını bir araya getiren web uygulaması.

## Mevcut sürüm

React, TypeScript ve Vite ile hazırlanmış ilk web prototipi. Türkiye, İngiltere, İspanya, Almanya, İtalya, Fransa ve Portekiz'den örnek takımlar; lig ve üç UEFA organizasyonu için örnek maç senaryoları içerir.

- Takım ve maç seçimi, rakip dosyası.
- Kategori ve arama ile haber filtreleme, haber ayrıntıları, kaydetme.
- Maça güven, hocaya destek ve oyuncu memnuniyeti için ayrı gösterimler.
- X / YouTube örneklem seçimi ve yöntem açıklamaları.
- Kaynak bağlantıları ve entegrasyon durumları.
- Takım tercihi ve kaydedilen haberler için tarayıcıda yerel saklama.

**Maçlar, haberler ve sentiment değerleri örnek veridir.** Canlı API, sosyal medya toplama, arka plan dinleme, hesap sistemi ve bildirim servisi henüz bağlı değildir. “Akışı dene” yalnızca yerel bir örnek haber ekler.

## Yerel çalıştırma

Node.js 22 LTS ve npm kullanın.

```sh
cd web
npm ci
npm run dev
```

Uygulama: http://localhost:5173

## Üretim çıktısı

```sh
cd web
npm ci
npm run build
```

Yayınlanacak statik dosyalar `web/dist/` içine yazılır. Sunucuda Nginx veya başka bir statik dosya sunucusu bu dizini servis edebilir. Geliştirme sunucusu üretimde kullanılmamalıdır. Mevcut sürüm için API anahtarı veya backend gerekmez. `vite.config.ts` içindeki geliştirme proxy ayarları henüz kullanılmamaktadır.

Sunucu dağıtımı henüz yapılmadı. Canlı kaynakların eklenmesi backend, kalıcı veri saklama ve kaynaklara uygun erişim gerektirir.

## Ürün ve veri notları

- [Ürün kapsamı](docs/SPORTS_PRODUCT_BRIEF.md)
- [Veri kaynakları araştırması](docs/SPORTS_DATA_RESEARCH.md)
- [Taraftar nabzı yaklaşımı](docs/SPORTS_FAN_PULSE.md)

Araştırma notlarındaki hedefler uygulanmış özellikler değildir. İlk web sürümü TypeScript kontrolü ve Vite üretim derlemesi ile doğrulanmıştır.
