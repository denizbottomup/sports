# Sports — ürün odağı

## Kullanıcının temel ihtiyacı

“Seçtiğim takımın o hafta oynayacağı maç öncesi, karşı takımda olan bütün gelişmeleri görebilmek. Sosyal medya bilgi almak için çok kötü. Ana işimiz bu.”

Ürünün temel işi, seçilen takımın yaklaşan rakibi hakkında kamuya açık gelişmeleri bir araya getirerek maç öncesi takip ihtiyacını karşılamak.

## Önerilen ana akış

1. Kullanıcı takımını seçer.
2. Lig ve UEFA fikstürleri birlikte taranır. O haftaki tüm maçlar ve rakipler gösterilir; varsayılan dosya en yakın maçtır. Kullanıcı daha sonraki maça geçebilir; maç yoksa bu durum açıkça gösterilir.
3. Ana ekran seçilen maçın rakip dosyasını açar: kısa güncel özet, gelişmelerin zaman akışı ve kaynakları görülebilen taraftar nabzı.
4. Dosya maç başlangıcına kadar güncellenir. Kullanıcı son ziyaretinden bu yana neyin değiştiğini görebilir.

## Önerilen içerik kapsamı

- Sakatlık, iyileşme, antrenmana dönüş ve oynama belirsizlikleri.
- Cezalar, kadro dışı kararları ve oyuncu uygunluğu.
- Antrenman, kamp, seyahat ve maç hazırlıkları.
- Teknik ekip ve oyuncu açıklamaları.
- Kadro, transfer ve teknik ekip değişiklikleri.
- Son maçlardan gelen gelişmeler, dinlenme süresi ve maç yoğunluğu.
- Kulüp içi gelişmeler ve rakibi ilgilendiren diğer haberler.
- Rakip taraftarların maça güveni, hocaya desteği, oyunculara yönelik memnuniyeti ve bunların zaman içindeki değişimi.

İçerikler futbol odağındadır. Her gelişme ilgili takım ve oyuncuyla; ceza, oyuncu uygunluğu ve kadro bilgisi ayrıca ilgili organizasyon ve maçla ilişkilendirilir.

## Bilginin sunumu

Her gelişme ne olduğunu, kiminle ilgili olduğunu, olay tarihini (biliniyorsa), yayın zamanını, kaynak bağlantısını ve son güncelleme zamanını göstermeli.

Resmî açıklamalar, basın haberleri ve doğrulanmamış iddialar açıkça etiketlenmeli. Çelişen kaynaklar görünür kalmalı. Aynı olayın tekrarları tek gelişmede birleştirilmeli; düzeltmeler ve durum değişiklikleri izlenebilmeli.

Maça olası etki yorumu eklenirse olgudan ayrı sunulmalı ve dayanağı gösterilmeli. Kaynak bulunmaması, gelişme olmadığı anlamına gelmemeli. Veri eksikliği veya güncellenemeyen kaynaklar kullanıcıya gösterilmeli.

“Bütün gelişmeler” kapsam hedefidir; eksiksiz takip garantisi verilmemeli. Kaynak kapsamı ve son başarılı kontrol zamanı anlaşılabilir olmalı.

## İlk sürüm için önerilen sınır

Takım seçimi → yaklaşan maç seçimi → rakip özeti → kaynaklı gelişmeler ve taraftar nabzı → son ziyaretten beri değişenler.

Başarı ölçütü: Kullanıcının farklı hesap ve siteleri tek tek dolaşmadan rakibin güncel durumunu anlayabilmesi ve bir bilginin kaynağına ulaşabilmesi.

## Henüz kararlaştırılmayanlar

- İlk seçilecek takım ve ilk sürümde etkinleştirilecek kaynaklar.
- Kullanılacak fikstür ve haber kaynakları ile bunların erişim koşulları.
- Kaynak başına uygulanabilir haber kontrol sıklığı ve uygulama dışı bildirim tercihleri.

## 8 Eylül 2026 — onaylanan kapsam

Spor futbol. Kullanıcı altıncı Avrupa ligi olarak Portekiz'i seçti. Onaylanan ulusal lig kapsamı İngiltere Premier League, İspanya LaLiga, Almanya Bundesliga, İtalya Serie A, Fransa Ligue 1, Portekiz Primeira Liga ve Türkiye Süper Lig'idir.

Avrupa maçları ürünün ana kapsamındadır. Çalışma kapsamı UEFA Şampiyonlar Ligi, Avrupa Ligi ve Konferans Ligi; ön elemeler ve play-off'lar dahil olacak şekilde belirlenmiştir. UEFA Süper Kupa ve yerel kupaların ayrıntılı kapsamı henüz kararlaştırılmadı. Yerel kupa maçlarının dinlenme süresini etkileyebileceği veri modelinde dikkate alınmalı.

Kullanıcı ücretsiz API'lerin, canlı servislerin ve diğer bilgi kaynaklarının araştırılmasını; uygulamanın yeni verileri sürekli takip edebilmesini istiyor.

Kaynak bildirimleri ve düzenli kaynak sorgulaması birlikte değerlendirilecek. Uygulama açık olmasa da sunucu tarafında takip devam etmeli. Kullanıcıya bildirim gönderme tercihi ayrıca belirlenecek; canlı veri toplama talebi, bu Codex görevinde bir hatırlatıcı oluşturma talebi değildir.

Araştırma ve önerilen mimari: [SPORTS_DATA_RESEARCH.md](SPORTS_DATA_RESEARCH.md).

## Lig ve Avrupa maçlarını birlikte takip etme

- Aynı haftadaki lig ve Avrupa maçlarının rakip dosyaları eşzamanlı hazırlanır. Birinin maç saati daha geç diye kaynak keşfi maç gününe bırakılmaz.
- Avrupa rakibi seçili yedi ulusal ligin dışındaysa da dosyası oluşturulur. Bu ligler kullanıcıların takım seçimi için ana kapsamı tanımlar; rakip takibine coğrafi sınır koymaz.
- Rakibin yerel kulüp açıklamaları ve muhabirleri özgün dilde takip edilir. Türkçe başlık/özet kaynakla birlikte sunulur; çeviri beklerken özgün başlık gösterilebilir ve dili belirtilir.
- Takım kimliği organizasyonlar arasında ortaktır. Lig haberi, Avrupa maçını da etkiliyorsa ilgili iki dosyada aynı gelişmeye bağlanır.
- Cezalar ve kayıtlı kadrolar organizasyona göre saklanır. Bir lig cezası otomatik olarak Avrupa maçına taşınmaz; uygulanabilirlik kaynakla doğrulanır.
- Saatler tek zaman standardında saklanıp kullanıcının saat diliminde gösterilir. Erteleme, rövanş, program değişikliği ve henüz belirlenmemiş rakip durumları desteklenir.

## Haber hızına ilişkin öncelik

Kullanıcı yapılandırılmış sakatlık verisinin dört saatte bir güncellenmesini yeterli buluyor. Temel hız gereksinimi, yeni bir haberin yayımlandıktan sonra ilgili kullanıcıya mümkün olan en kısa sürede ulaştırılmasıdır.

Yeni sakatlık açıklaması da bir haberdir; dört saatlik veri yenilemesi beklenmeden haber akışına alınır. İlk kart kaynak başlığı, bağlantısı, yayın zamanı ve kaynak türüyle gösterilir. Takım/branş eşleştirmesi ve temel tekrar kontrolü yapılır; yapay zekâ özeti ve ayrıntılı değerlendirme ilk gösterimi bekletmez. Bir iddia, hızlı gösterildiği için doğrulanmış bilgiye dönüşmez.

Kaynak seçiminde haberin ilk yayınına doğrudan erişim ve ölçülen gecikme önceliklidir. Kontrol sıklığını yalnızca maça yakın artırmak yeterli değildir; seçilen rakibin maç öncesi takip dönemi boyunca hızlı haber toplama etkin olmalı.

## Taraftar nabzı — onaylanan ihtiyaç

Kullanıcı rakiple ilgili sosyal medyada neler konuşulduğunu, hangi oyunculardan ve teknik direktörden memnun olunduğunu, özellikle maç öncesinde rakip taraftarların takımlarına inanıp inanmadığını görmek istiyor.

Maça güven, hocaya destek, oyuncu memnuniyeti ve genel takım havası ayrı değerlendirilir. Her sonuç platform, zaman aralığı, incelenen yorum/hesap sayısı, veri yeterliliği ve dayanak kaynaklarla gösterilir. Sosyal medya örneklemi bütün taraftarların görüşü veya maçın kazanılma ihtimali gibi sunulmaz.

Aynı haftadaki lig ve Avrupa maçlarının güven değerlendirmeleri maç kimliğine göre ayrılır. Genel hoca/oyuncu değerlendirmesi ilgili dosyalarda ortak kullanılabilir; hangi döneme ait olduğu görünür kalır. Yeni haberlerin hızlı gösterimi, sentiment işlemesinin tamamlanmasını beklemez.

Ayrıntılı tasarım: [SPORTS_FAN_PULSE.md](SPORTS_FAN_PULSE.md).

## Mevcut teknik durum

İlk spor web arayüzü React, TypeScript ve Vite ile uygulandı. Takım ve maç seçimi, rakip haberleri, kategori/arama filtreleri, kaydetme, kadro notları ve taraftar nabzı ekranları örnek verilerle çalışıyor. Takım tercihleri ve kaydedilen haberler tarayıcıda saklanıyor.

Bu depo spor web uygulamasının bağımsız kopyasıdır; önceki BottomUP Signals kripto uygulamasının backend ve Git geçmişini içermez. Canlı fikstür, haber veya sosyal medya entegrasyonu, gerçek sentiment analizi, arka plan dinleme ve bildirimler henüz uygulanmadı. Yukarıdaki maddeler ürün hedeflerini tanımlar. Kurulum ve üretim derlemesi için kökteki README dosyasına bakın.
