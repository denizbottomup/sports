# Taraftar nabzı — maç öncesi rakibe güven ve memnuniyet

Tarih: 8 Eylül 2026. Durum: Kullanıcı ihtiyacı kaydedildi; aşağıdaki yöntem uygulama önerisidir. Henüz sosyal medya örneklemi toplanmadı, model veya canlı entegrasyon kurulmadı.

## Kullanıcının görmek istediği

Rakip hakkında sosyal medyada ne konuşuluyor? Hangi futbolculardan memnunlar? Hocayı destekliyorlar mı? Yaklaşan maç öncesinde takımlarına inanıyorlar mı?

Bu bölüm, yedi ulusal lig ve UEFA maçları için rakip dosyasının parçasıdır. Avrupa rakibi ana lig kapsamının dışından gelse de aynı yaklaşım uygulanır.

## Ekranda ayrı gösterilecek değerlendirmeler

| Başlık | Sorduğumuz soru | Sunum |
|---|---|---|
| Bu maça güven | Belirli rakibe karşı nasıl bir sonuç bekliyorlar? | İyimser, karamsar, karışık veya belirsiz beklenti; son döneme göre değişim |
| Hocaya destek | Teknik direktörün tercihleri ve devam etmesi hakkında ne düşünüyorlar? | Destek/eleştiri dağılımı ve en çok tartışılan kararlar |
| Oyuncu memnuniyeti | Kim övülüyor, kim eleştiriliyor ve neden? | Oyuncu bazında olumlu/olumsuz/karışık/nötr görüşler, konuşulma hacmi |
| Takımın genel havası | Takımın gidişatı nasıl değerlendiriliyor? | Genel eğilim; bu maça özel beklentiden ayrı |
| Öne çıkan konular | Tartışmayı hangi konular taşıyor? | Savunma, bitiricilik, kadro seçimi gibi kanıtlı konu özetleri |

Tek bir genel olumlu/olumsuz sayı bu ihtiyacı karşılamaz. “Hocayı beğenmiyorum ama bu maçı kazanırız” ifadesinde hocaya yaklaşım olumsuz, maç beklentisi olumludur. Bu örnek yöntem açıklamasıdır, gerçek paylaşım değildir.

Bir oyuncunun çok konuşulması o oyuncudan memnun olunduğunu göstermez. Destek sloganı da tek başına belirli bir maçı kazanma beklentisi olarak etiketlenmemeli. Bir gönderi birden fazla hedef hakkında ayrı görüşler taşıyabilir.

## Kaynak erişimi

X Filtered Stream, takım/oyuncu/maç isimleri, etiketler ve hesap kurallarıyla eşleşen paylaşımları kalıcı bağlantı üzerinden yakın gerçek zamanlı iletebiliyor. Yalnızca kulüp ve gazeteci hesaplarıyla sınırlandırılan önceki haber takibine, taraftar konuşmalarını yakalayan sorgular eklenmeli. Bu genişleme veri hacmini artırır; platformun kullanıma göre ücretlendirmesi için bütçe hesabı gerekir. Hesap erişimi ve birim fiyatlar Developer Console'dan doğrulanacak. [Stream dokümanı](https://docs.x.com/x-api/posts/filtered-stream/introduction), [ücretlendirme](https://docs.x.com/x-api/fundamentals/post-cap)

YouTube'da kulüp ve taraftar kanallarının maç öncesi videolarındaki yorumlar tamamlayıcı kaynak olabilir. `commentThreads.list` zaman sırasıyla, sayfa başına en fazla 100 yorum dizisi döndürebiliyor ve çağrı başına 1 kota birimi kullanıyor. Kapsamlı yanıt toplamada `comments.list` ayrıca değerlendirilir. Yorumlar kapalı veya erişim kısıtlı olabilir; yalnızca en beğenilen yorumları almak örneklem tasarımı değildir. [Yorum dizileri](https://developers.google.com/youtube/v3/docs/commentThreads/list), [yorum yanıtları](https://developers.google.com/youtube/v3/docs/comments/list)

YouTube'un video yükleme ve başlık/açıklama değişikliği bildirimleri, yeni yorum bildirimi sağlamaz. Yorumlar ayrıca kota dahilinde sorgulanmalı. [Bildirimlerin kapsamı](https://developers.google.com/youtube/v3/guides/push_notifications)

Taraftar forumları veya diğer sosyal platformlar, belgelenmiş erişim ve kaynak koşulları doğrulandıktan sonra genişleme adayıdır. Henüz doğrulanmış kaynak sayılmazlar. X bağlanmadıysa YouTube'dan çıkan sonuç açıkça YouTube örneklemi olarak adlandırılır; tüm sosyal medyayı temsil ettiği söylenmez.

## Örneklem ve görüş sahibinin bağlamı

Takım hakkında konuşan herkes o takımın taraftarı değildir. Haber aktaran hesaplar, rakip taraftar yorumları ve bağlamı belirsiz yorumlar aynı taraftar görüşü havuzuna otomatik katılmaz.

Kamuya açık yorumdaki açık aidiyet ifadesi ve ilgili taraftar topluluğu bağlamı destekleyici sinyal olabilir; bir kanala yorum yapmak tek başına aidiyeti kanıtlamaz. Aidiyeti yeterince desteklenmeyen içerik genel takım konuşmalarında kalır. Taraftar aidiyeti kalıcı kişisel profil oluşturmak için kullanılmaz; sonuçlar toplu olarak sunulur.

Gönderi düzeyinde takım, branş, oyuncu, teknik direktör, dil, konuşulan konu ve varsa maç kimliği eşleştirilir. Aynı haftanın lig maçıyla Avrupa maçı karıştırılmaz. Bağlamı belirsiz beklenti, genel takım havasına dahil edilebilir ama belirli maçın güven göstergesine eklenmez.

Retweet/yeniden paylaşım ve kopya metinler yeni bağımsız görüş sayılmaz. Yeni yorum içeren alıntılar kendi metinleriyle değerlendirilebilir. Beğeni sayısı ana ölçütte oy ağırlığı olarak kullanılmaz; popülerlik ayrı metrik olabilir. Yüksek paylaşım sıklığı tek başına bot kanıtı kabul edilmez.

## Sayılar nasıl hesaplanacak?

Önerilen ilk hesap birimi platform + hesap + hedef + zaman penceresidir. Bir hesabın aynı hedef hakkında aynı dönemde yazdığı çok sayıda yorum, toplam sonuçta çok sayıda ayrı taraftar gibi ağırlık kazanmaz. Aynı dönemde çelişen görüşler karışık olarak korunur. Platformlar arasında hesapların aynı kişi olduğu varsayılmaz.

Her gösterge sınıflandırılabilen olumlu/olumsuz veya iyimser/karamsar görüşlerin yanında nötr, karışık ve belirsiz sayısını gösterir. Örneğin bir iyimserlik oranı sunulursa pay iyimser hesap-hedef kayıtları, payda ise o maç için iyimser + karamsar + karışık olarak değerlendirilebilen kayıtlardır; dışlanan belirsiz ve ilgisiz kayıt sayıları ayrıca görünür. Genel takım duygusunun paydası maç beklentisinin paydasıyla aynı değildir.

“Taraftarların yüzde X'i inanıyor” yerine “İncelenen ve maç beklentisi belirlenebilen hesapların yüzde X'i iyimser” gibi örneklemin sınırını anlatan ifade kullanılır. Bu oran maç kazanma olasılığı değildir. Ana ekranda sayısal kesinlik yerine gerekirse “görüşler bölünmüş” gibi özet gösterilebilir.

Başlangıç için önerilen ürün eşiği: platform/hedef/pencere başına en az 30 farklı değerlendirmeye uygun hesap yoksa yüzde gösterme; “sınırlı veri” ve dayanak görüşleri sun. Bu bir istatistiksel temsil garantisi değildir; eşik pilot ölçümüyle ayarlanacak. Otuz tek yönlü veya tek topluluktan gelen kayıt da taraftar kitlesini temsil etmeyebilir.

Platform sonuçları varsayılan olarak ayrı gösterilir. Birleşik puan ancak örnekleme/ağırlıklandırma yöntemi tanımlanıp doğrulandıktan sonra değerlendirilir. Veri yokluğu nötr veya yüzde 50 olarak doldurulmaz. Kotalar yüzünden kesilen veya örneklenen akış açıkça işaretlenir.

## Zaman ve haber bağlantısı

Maç öncesi son 24 saat ana pencere; son 7 gün bağlam ve son birkaç saat daha kısa eğilim için kullanılabilir. 24 saatlik değişim aynı uzunluktaki önceki 24 saatle, aynı platform ve karşılaştırılabilir sorgu kapsamıyla ölçülür. Veri hacmi ve kaynak bileşimi değişirse bu da gösterilir.

Maç başlangıcı öncesindeki anlık görüntü saklanır. Maç başladıktan sonra gelen yorumlar maç öncesi değerlendirmeyi geriye dönük değiştirmez; erteleme/program değişikliği pencere hesabına yansıtılır.

Bir kadro açıklamasıyla aynı zamanlarda güven değişirse kullanıcı ikisini birlikte görebilir. Bu yalnızca zamansal ilişki olarak anlatılır; kaynaksız neden-sonuç iddiası kurulmaz. Yorum metni açıkça ilgili olaya tepki veriyorsa konu bağlantısı kurulabilir.

Önerilen yenileme hedefi: yeni sosyal içerikler erişildiğinde işlenir; toplu göstergeler yeterli yeni veri varsa 1–5 dakikalık aralıklarla güncellenir. Bu ölçülmemiş bir uygulama hedefidir. Haber kartlarının hızlı gösterimi bu işin tamamlanmasını beklemez. Kartta son hesaplama ve son başarılı veri alımı ayrı gösterilir.

## Çok dil ve açıklanabilirlik

İngilizce, İspanyolca, Almanca, İtalyanca, Fransızca, Portekizce ve Türkçe için takım/oyuncu adları, lakaplar ve futbol ifadeleri değerlendirilir. UEFA rakibinin dili desteklenmiyorsa kapsam eksikliği görünür kalır. Analiz mümkünse özgün metin üzerinde yapılır; Türkçe çeviri gösterim katmanıdır.

İroni, alıntılanan rakip görüşü, küfür içeren övgü ve kısa sloganlarda belirsizliği koru. Model güveni ile örneklem yeterliliği ayrı ölçülür. Skoru gerekçelendiren olumlu, olumsuz ve karışık görüş örnekleri kaynak bağlantılarıyla açılır; erişilmeyen veya uydurulan alıntı gösterilmez.

## Pilot doğrulaması

İlk pilot, lig ve Avrupa maçı aynı haftaya gelen bir takımın rakipleriyle yapılmalı. Gerçek erişim doğrulandıktan sonra maç öncesi paylaşımlar platform ve dil bazında örneklenir; insan etiketleriyle takım/maç eşleşmesi, aidiyet bağlamı, hedef bazında duygu ve ironi hataları ölçülür. Her dilin kapsamı ve hata düzeyi ayrı raporlanır; doğrulanmamış dilde güvenilir puan vaat edilmez.

Kabul senaryoları: hocayı eleştirip galibiyet bekleyen yorum; lig için karamsar Avrupa için iyimser yorum; aynı hesabın yüz kopyası; rakip taraftarın alayı; düşük hacim; yorum erişimi kesintisi; farklı oyunculara zıt değerlendirmeler. Model hedefleri ve hata eşikleri pilot etiketleme tamamlandıktan sonra kararlaştırılacak.

Sosyal veri alımı, sınıflandırma ve toplu sonuç işleme ayrı kuyruklarda çalışmalı. Ham kaynak kimliği, model sürümü, pencere ve hesaplama zamanı izlenebilir olmalı. Düzeltilen/silinen kayıtlar kaynak koşullarına uygun güncellenmeli; toplu göstergeler ilgili değişiklikten sonra tekrar hesaplanabilmeli.
