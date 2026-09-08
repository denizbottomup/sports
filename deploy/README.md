# Railway dağıtımı

Depo kökündeki `Dockerfile` Node.js 22 ile web uygulamasını derler; yalnızca statik üretim çıktısını Nginx imajına taşır. Geliştirme sunucusu üretimde çalışmaz.

Railway servis ayarları:

- Kaynak: `denizbottomup/sports`, dal: `main`; servis: `sports`.
- Root Directory: `/` (Dockerfile depo kökünde).
- Builder: Dockerfile; yapılandırma: `/railway.json`.
- Start Command: boş bırakılır; Dockerfile komutu kullanılır.
- Port: Railway `PORT` değişkenini sağlar; yerel varsayılan `8080`.
- Healthcheck: `/healthz`.
- Public Networking: Railway alan adı oluşturulur.
- Bu örnek sürüm için ek secret, veritabanı veya volume gerekmez.

GitHub kaynağı bağlandığında `main` dalına yapılan push işlemleri otomatik dağıtımı tetikleyebilir. İlk servis bağlantısı için Railway hesabının depoya erişimi olmalıdır.

CLI ile mevcut servise manuel dağıtım, bu dizinin üstündeki depo kökünden yapılır:

```sh
railway login
railway link
railway up --service sports --ci
railway domain --service sports
```

Yerel Docker doğrulaması:

```sh
docker build -t touchline-web .
docker run --rm -p 8080:8080 -e PORT=8080 touchline-web
curl --fail http://localhost:8080/healthz
```

Yayın sonrası `/healthz`, ana sayfa ve HTML içindeki JavaScript/CSS dosyaları HTTP 200 dönmeli. Haber kaydetme, takım seçimi ve mobil görünüm tarayıcıda doğrulanmalı. Bilinmeyen asset adresleri 404 dönmelidir.

Statik dosyalarda değişiklik olduğunda önceki başarılı deployment Railway panelinden yeniden dağıtılarak geri alınabilir. Kullanıcı tercihleri tarayıcıda tutulur; yeni alan adı localhost'taki tercihleri devralmaz.

Maçlar, haberler ve sentiment hâlâ örnek veridir. Sunucuda yayınlamak canlı kaynak bağlantılarını etkinleştirmez.

Resmî referanslar: [Dockerfile dağıtımı](https://docs.railway.com/builds/dockerfiles), [sağlık kontrolleri](https://docs.railway.com/deployments/healthchecks).
