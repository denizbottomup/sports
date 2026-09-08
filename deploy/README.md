# Railway dağıtımı

Dockerfile Node.js 22 ile web uygulamasını derler; Express sunucusu üretim çıktısını, API'yi ve SSE bağlantısını birlikte sunar.

Servis ayarları:

- Kaynak `denizbottomup/sports`, dal `main`, servis `sports`; Auto Deploy açık.
- Root Directory `/`, builder Dockerfile, Dockerfile Path `Dockerfile`.
- Start Command boş; Dockerfile komutu kullanılır.
- `PORT` Railway tarafından sağlanır; Docker varsayılanı `8080`.
- Healthcheck `/healthz`.
- Kalıcı volume `/app/data` konumuna bağlanır; Dockerfile `DATA_DIR=/app/data` ayarlar.
- `GOOGLE_CLIENT_ID` ortam değişkeni Railway servis ayarlarında tanımlanır (Google OAuth Web istemci kimliği); canlı alan adı Google Cloud Console'da Authorized JavaScript origins listesine eklenir. `ANTHROPIC_API_KEY` isteğe bağlıdır; tanımlanırsa resmî haberlerden kullanıcı dilinde özetler üretilir, tanımlanmazsa uygulama kısa aktarım moduna düşer. `APIFOOTBALL_KEY` isteğe bağlıdır; kadroların oyuncu fotoğraflı gelmesini sağlar (dashboard.api-football.com ücretsiz katman yeterlidir). Veri kaynakları için başka secret gerekmez.

Kalıcı dizin haber/fikstür anlık görüntüsünü, kullanıcı hesaplarını (`users.json`), takım dizinini (`teams.json`) ve kaynak görsellerini saklar. Görsel önbelleği 256 MB ve 30 günlük saklama sınırıyla temizlenir. Bu sürüm tek replika içindir; toplayıcı süreç sunucuyla birlikte çalışır.

Builder ve sağlık kontrolü ayarları Railway servis panelinde tutulur. `main` dalına push otomatik dağıtımı tetikler.

```sh
docker build -t touchline-web .
docker run --rm -p 8080:8080 -e PORT=8080 -v touchline-data:/app/data touchline-web
curl --fail http://localhost:8080/healthz
curl --fail http://localhost:8080/api/dashboard
```

Yayın sonrası sağlık kontrolü, API'deki ilk maç, haber kaynakları ve gerçek görseller canlı adreste doğrulanmalıdır. Sağlık kontrolü süreç durumunu ölçer; kaynakların ilk yüklenmesi ayrıca beklenmelidir. Bilinmeyen asset adresleri 404 dönmelidir. Haber kaydetme ve mobil görünüm tarayıcıda kontrol edilmelidir.

Geri alma Railway panelinden önceki başarılı deployment yeniden dağıtılarak yapılır. Hesaplar ve takım tercihleri volume üzerindeki `users.json` dosyasında durur; kaydedilen haberler tarayıcıda tutulur.
