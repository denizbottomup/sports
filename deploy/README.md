# Railway dağıtımı

Dockerfile Node.js 22 ile web uygulamasını derler; Express sunucusu üretim çıktısını, API'yi ve SSE bağlantısını birlikte sunar.

Servis ayarları:

- Kaynak `denizbottomup/sports`, dal `main`, servis `sports`; Auto Deploy açık.
- Root Directory `/`, builder Dockerfile, Dockerfile Path `Dockerfile`.
- Start Command boş; Dockerfile komutu kullanılır.
- `PORT` Railway tarafından sağlanır; Docker varsayılanı `8080`.
- Healthcheck `/healthz`.
- Kalıcı volume `/app/data` konumuna bağlanır; Dockerfile `DATA_DIR=/app/data` ayarlar.
- Mevcut veri kaynakları için ek secret gerekmez.

Kalıcı dizin haber/fikstür anlık görüntüsünü ve kaynak görsellerini saklar. Görsel önbelleği 256 MB ve 30 günlük saklama sınırıyla temizlenir. Bu sürüm tek replika içindir; toplayıcı süreç sunucuyla birlikte çalışır.

Builder ve sağlık kontrolü ayarları Railway servis panelinde tutulur. `main` dalına push otomatik dağıtımı tetikler.

```sh
docker build -t touchline-web .
docker run --rm -p 8080:8080 -e PORT=8080 -v touchline-data:/app/data touchline-web
curl --fail http://localhost:8080/healthz
curl --fail http://localhost:8080/api/dashboard
```

Yayın sonrası sağlık kontrolü, API'deki ilk maç, haber kaynakları ve gerçek görseller canlı adreste doğrulanmalıdır. Sağlık kontrolü süreç durumunu ölçer; kaynakların ilk yüklenmesi ayrıca beklenmelidir. Bilinmeyen asset adresleri 404 dönmelidir. Haber kaydetme ve mobil görünüm tarayıcıda kontrol edilmelidir.

Geri alma Railway panelinden önceki başarılı deployment yeniden dağıtılarak yapılır. Hesap sistemi henüz yoktur; kaydedilen haberler tarayıcıda tutulur.
