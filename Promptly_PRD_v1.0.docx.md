**Loom \+ Prompter**

Product Requirements Document

v1.0 · Confidential · April 2026

# **1\. Executive Summary**

**Ürün Adı:** Promptly (çalışma adı)

**Tagline:** "Söyle, göster, paylaş." — Kurumsal video mesajlaşma; ama bu sefer herkes profesyonel gibi konuşur.

Loom, async video mesajlaşmayı mainstream yaptı. Ama Loom'un çözmediği bir problem var: kamera karşısında script okumak doğal görünmüyor çünkü gözler ya aşağı iner ya da metin overlay'i ekran kaydına giriyor. Promptly bu boşluğu kapatır.

Promptly, kullanıcının sesi tanıyarak metni gerçek zamanlı ilerletir; prompter hiçbir zaman ekran kaydında görünmez. Sonuç: her çalışan, ekibine veya müşterisine profesyonel, akıcı, hazırlıklı video mesajlar gönderebilir.

| 🎯  Temel Differentiator Loom → ekran \+ kamera kaydı \+ paylaşım Textream → sadece teleprompter (kayıt yok, paylaşım yok) Promptly → ekran \+ kamera kaydı \+ ses-senkronize invisible prompter \+ paylaşım Kimse üçünü birden yapmıyor. |
| :---- |

# **2\. Problem & Fırsat**

## **2.1 Problem Tanımı**

Kurumsal async video gönderen bir kullanıcı şu seçeneklerle karşı karşıya:

| Yöntem | Sorun | Sonuç |
| :---- | :---- | :---- |
| Ezber / doğaçlama | Çok fazla 'eem', tekrar, yanlış cümle | Unprofessional görünür |
| Script'i kağıda yaz | Kameraya değil, kağıda bakıyor | Güven kaybı |
| Ekran üstü metin overlay | Ekran kaydında görünür | Amatörce |
| Çok çekim yap, edit et | Zaman kaybı, teknik bilgi gerekir | Ölçeklenmiyor |

## **2.2 Pazar Fırsatı**

* **Loom** 400.000+ şirket, 2023'te Atlassian tarafından \~975M$ değerle satın alındı.

* Async video mesajlaşma 2025'te kurumsal iletişimin standart parçası haline geldi.

* Teleprompter yazılımı (PromptSmart, Speeko, vb.) ayrı bir niş — ama kayıt \+ paylaşım entegrasyonu yok.

* 'Prompter \+ kayıt \+ paylaşım' kombinasyonunu yapan SaaS mevcut değil.

# **3\. Vizyon & Hedefler**

**Vizyon:** Her çalışanın kamera önünde profesyonel görünebileceği, hazırlıklı async video platformu.

## **3.1 12 Aylık Başarı Kriterleri**

| Metrik | 6\. Ay Hedefi | 12\. Ay Hedefi |
| :---- | :---- | :---- |
| Aktif kullanıcı (MAU) | 500 | 5.000 |
| Kaydedilen video / ay | 2.000 | 25.000 |
| Prompter kullanım oranı | ≥ 60% | ≥ 75% |
| Free → Pro dönüşüm | — | ≥ 8% |
| Ortalama video süresi | \< 5 dk | \< 4 dk |
| NPS | ≥ 40 | ≥ 55 |

# **4\. Hedef Kullanıcılar**

## **4.1 Birincil Persona — Kurumsal İletişimci**

| 👤  Alex, Customer Success Manager 35 yaş, B2B SaaS şirketinde çalışıyor. Haftada 10–15 video mesaj gönderiyor: onboarding, güncelleme, eskalasyon. Loom kullanıyor ama hazırlık gerektiren mesajlarda çok fazla retake yapıyor. Teleprompter'dan haberi var ama ayrı uygulama açmak workflow'u kesiyor. İstediği: script yaz → kaydet → gönder. Tek adımda. |
| :---- |

## **4.2 İkincil Persona — Internal Communicator**

| 👤  Jordan, HR Business Partner Tüm şirkete video duyurular gönderiyor: quarterly updates, policy changes. Doğaçlama konuşunca toparlayamıyor, güvensiz hissediyor. Yazılı script varsa net ve güçlü konuşuyor. Video platformunu IT'nin onaylaması gerekiyor — güvenlik önemli. |
| :---- |

## **4.3 Non-Hedef (v1)**

* YouTuber / içerik üreticisi — onların ihtiyacı farklı (editing, B-roll, thumbnail)

* Sales outreach (Loom'un asıl hedefi) — rakip pozisyon, v2'de düşünülebilir

* Mobil kullanıcı — desktop-first, mobil v2

# **5\. Ürün Mimarisi**

Promptly üç bileşenden oluşur:

| Bileşen | Platform | Açıklama |
| :---- | :---- | :---- |
| Desktop App | macOS (Swift) | Kayıt \+ Prompter. Core ürün. |
| Web App | React / Next.js | Video library, paylaşım, analytics, team yönetimi. |
| Marketing Site | Next.js (static) | Landing page, pricing, blog, waitlist. |

| 🔧  Teknik Not — Textream Referansı Textream (MIT lisanslı, github.com/f/textream) ses-senkronize prompter için referans alınabilir. SpeechRecognizer.swift — Apple on-device Speech framework kullanıyor, cloud yok, latency yok. NotchOverlayController.swift — Tüm appların üzerinde floating window; ekran kaydından exclude edilebilir (CGWindowListOption \+ SCContentFilter). Bu iki bileşen Promptly desktop app'ine entegre edilerek 4–6 haftalık geliştirme tasarrufu sağlanabilir. Kritik fark: Textream metnin önünde kalıyor. Promptly'de overlay SADECE KASIYON EKRANINDA görünür, capture edilemez. |
| :---- |

# **6\. Feature Set**

## **6.1 macOS Desktop App**

### **P0 — MVP'de olması gereken**

| Feature | Açıklama | Öncelik |
| :---- | :---- | :---- |
| Script editörü | Kayıt öncesi script yazma / yapıştırma alanı. Basit rich text. | **P0** |
| Ekran \+ kamera kaydı | Tüm ekran veya pencere seçimi. Webcam overlay (sağ alt, boyut ayarlı). | **P0** |
| Ses-senkronize prompter | Apple Speech framework ile on-device tanıma. Söylenen kelime highlight; otomatik scroll. Tamamen offline. | **P0** |
| Invisible overlay | SCContentFilter ile overlay capture-excluded. Ekran kaydında asla görünmez. | **P0** |
| Pause & resume | Konuşmayı bırakınca tracker bekler; devam edince kaldığı yerden. | **P0** |
| Kayıt bitir & yükle | Video tamamlandığında otomatik web app'e upload. | **P0** |
| Hız kontrolü | Prompter scroll hızı manuel ayarlı (otomatike ek güvence). | **P1** |
| Font / boyut ayarı | Prompter text boyutu, renk, contrast ayarı. | **P1** |
| Tap-to-jump | Overlay'deki herhangi kelimeye tıklayınca tracker o noktaya atlar. | **P1** |
| Çoklu dil desteği | Türkçe dahil 10+ dil (Apple Speech destekli). | **P1** |
| Trim & temel edit | Başını / sonunu kırp. Silence detection ile otomatik önerir. | **P2** |
| AI script önerisi | Kullanıcı konu girer → AI script taslağı üretir. | **P2** |

## **6.2 Web App**

### **P0 — MVP**

* **Video library:** Tüm kayıtlar liste / grid görünümü, arama, filtre.

* **Paylaşım linki:** Her video için benzersiz URL. Password protection opsiyonel.

* **Video player:** Otomatik transcript, closed captions. 50+ dil (Whisper API).

* **Workspace & team:** Takım üyesi davet, video klasörleme.

* **Notification:** Video izlendiğinde e-posta bildirimi.

### **P1**

* **Viewer analytics:** Kim izledi, ne kadar izledi, replay yaptı mı?

* **Reaction & comment:** Emoji reaksiyon, zaman damgalı yorum.

* **CTA button:** Videodan doğrudan aksiyon linki (Calendly, form, vb.).

* **Embed kodu:** Notion, Confluence, Slack'e gömme.

### **P2**

* **AI özet:** Video izlemeden önce 3 cümlelik özet.

* **Folder templates:** Onboarding, quarterly update gibi hazır klasör şablonları.

* **SSO / SAML:** Kurumsal login (Enterprise tier).

## **6.3 Marketing Site**

* Hero section: 60 saniyelik demo video (ürünün kendisiyle kaydedilmiş)

* How it works: 3 adım animasyonu

* Pricing sayfası

* Use case sayfaları: Customer Success, HR, Engineering

* Waitlist / erken erişim formu

* Blog (SEO: 'best teleprompter app', 'loom alternative', 'async video tool')

# **7\. Prompter — Teknik Detay**

## **7.1 Ses Tanıma Mimarisi**

Apple'ın on-device Speech Recognition framework'u kullanılır (AVFoundation \+ SFSpeechRecognizer). Hiçbir ses verisi cloud'a gitmez. Bu hem privacy hem latency açısından kritik.

| Parametre | Değer | Neden |
| :---- | :---- | :---- |
| Tanıma latency | \~200ms | On-device, no network hop |
| Minimum macOS | macOS 13 Ventura | SFSpeechRecognizer stability |
| Offline çalışma | Evet | Apple on-device model |
| Desteklenen diller | 60+ (Apple listesi) | Türkçe dahil |
| CPU/RAM etkisi | Düşük (\~3% CPU) | Apple Silicon optimize |

## **7.2 Fuzzy Matching Algoritması**

Konuşmacı bazen kelimeyi tam söylemez (hızlı geçer, yutabilir, yanlış sıraya koyabilir). Bu yüzden string exact match yerine fuzzy match kullanılır:

* Levenshtein distance ≤ 2 → match say

* Phonetic normalization (Türkçe için ğ→g, ü→u, vb.) → daha toleranslı

* Look-ahead buffer: tanınan son 5 kelimeyi buffer'da tut, script'le sliding window match

* Confidence threshold: Apple'ın isBestTranscription kalitesi \< 0.4 ise skip

## **7.3 Invisible Overlay Tekniği**

Bu ürünün en kritik teknik özelliği: prompter overlay ekran kaydında görünmemeli.

| ⚙️  Implementasyon Yöntemi ScreenCaptureKit (macOS 12.3+) ile SCContentFilter kullanılır. Overlay window'un CGWindowID'si SCContentFilter'dan exclude edilir. Bu sayede ReplayKit veya third-party ekran kaydı araçları (OBS dahil) overlay'i capture edemez. NSWindow.sharingType \= .none ek güvence olarak eklenir. Test edilmesi gereken: Loom, QuickTime, OBS, Zoom screen share — hepsinde görünmez olmalı. |
| :---- |

# **8\. Monetizasyon**

## **8.1 Plan Yapısı**

|  | Free | Pro ($12/ay) | Team ($10/kişi/ay) |
| :---- | :---- | :---- | :---- |
| Video limiti | 25 video / ay | Sınırsız | Sınırsız |
| Video süresi | Maks 5 dk | Sınırsız | Sınırsız |
| Prompter | ✓ | ✓ | ✓ |
| Transcript | ✗ | ✓ (50+ dil) | ✓ (50+ dil) |
| Viewer analytics | ✗ | ✓ | ✓ |
| Password protection | ✗ | ✓ | ✓ |
| AI script önerisi | ✗ | ✓ (20/ay) | ✓ (unlimited) |
| Workspace yönetimi | ✗ | ✗ | ✓ |
| SSO / SAML | ✗ | ✗ | Enterprise add-on |
| Custom domain | ✗ | ✗ | ✓ |

| 💡  Freemium Kurgusunun Mantığı Video limiti (25/ay) → Aktif kullanıcıyı upgrade'e iter, casual deneyen için yeterli. 5 dk limit → Kurumsal mesajların çoğu zaten 3–4 dk. Kısa mesajlarda acı vermez. Prompter her planda ücretsiz → Bu ürünün core differentiator'ı. Deneme engellenemez. AI script → Yüksek perceived value, düşük maliyet. Pro'nun 'wow' feature'ı. |
| :---- |

# **9\. Roadmap**

| Dönem | Milestone | İçerik |
| :---- | :---- | :---- |
| Ay 1–2 | Alpha | macOS app: kayıt \+ invisible prompter (MVP). Internal test. |
| Ay 3 | Private Beta | Web app: video library \+ share link. Waitlist kullanıcıları. |
| Ay 4 | Public Launch | Freemium live. Transcript. Viewer analytics. App Store başvurusu. |
| Ay 5–6 | Growth | AI script önerisi. Tap-to-jump. Çoklu dil. Slack / Notion embed. |
| Ay 7–9 | Team Tier | Workspace yönetimi. Team plan. CTA button. Reaction & comment. |
| Ay 10–12 | Enterprise | SSO/SAML. Custom domain. Advanced analytics. API. |

# **10\. Riskler & Azaltma**

| Risk | Seviye | Azaltma |
| :---- | :---- | :---- |
| Apple, SCContentFilter API'yi kısıtlarsa overlay capture dışında tutulamaz |  **YÜKSEK**  | Erken test \+ Apple developer relations. Fallback: companion camera app. |
| Ses tanıma gürültülü ortamlarda başarısız |  **ORTA**  | Manuel hız kontrolü her zaman açık. Gürültü filtresi (AVAudioEngine). |
| Loom benzer özellik ekler (Atlassian kaynakları var) |  **ORTA**  | Prompter \+ kayıt entegrasyonu 6 ay+ sürer büyük şirkette. Hız önemli. |
| App Store notarizasyon süreci uzar |  **DÜŞÜK**  | Direct DMG dağıtımı \+ Homebrew tap ile launch yapılabilir. |
| GDPR / veri gizliliği (kurumsal müşteriler) |  **ORTA**  | Ses tamamen on-device. Video EU sunucusunda saklanır (opsiyonel). |

# **11\. Açık Sorular**

* Ürün adı kararlaştırılacak. Promptly, Readio, Lore, Presto — marka tescil araştırması gerekiyor.

* Windows desteği ne zaman? macOS-first mantıklı (ScreenCaptureKit macOS exclusive) ama kurumsal müşteriler sorabilir.

* Video hosting altyapısı: kendi S3 bucket'ı mı, Mux/Cloudflare Stream mi? Maliyet modeli etkiler.

* Whisper API mı, yerel Whisper modeli mi? Transcript için: API ucuz ama latency var; on-device daha iyi UX.

* Textream kodu fork mu edilecek yoksa sadece mimari referans mı? MIT lisansı fork'a izin veriyor.

* iOS / iPadOS: Prompter olarak iPad ikinci ekran gibi mi kullanılacak?

# **12\. Ekler**

## **12.1 Referans Kaynaklar**

* Loom: [loom.com](https://www.loom.com)

* Textream (MIT): [github.com/f/textream](https://github.com/f/textream)

* Apple ScreenCaptureKit: [developer.apple.com/documentation/screencapturekit](https://developer.apple.com/documentation/screencapturekit)

* Apple SFSpeechRecognizer: [developer.apple.com/documentation/speech](https://developer.apple.com/documentation/speech)

## **12.2 Rekabet Analizi**

|  | Promptly | Loom | Textream | PromptSmart |
| :---- | :---- | :---- | :---- | :---- |
| Ekran kaydı | ✓ | ✓ | ✗ | ✗ |
| Ses-senkronize prompter | ✓ | ✗ | ✓ | ✓ (iOS) |
| Invisible overlay | ✓ | — | ✓ | — |
| Video paylaşım linki | ✓ | ✓ | ✗ | ✗ |
| Viewer analytics | ✓ (Pro) | ✓ | ✗ | ✗ |
| Transcript | ✓ (Pro) | ✓ | ✗ | ✗ |
| On-device AI | ✓ | ✗ | ✓ | Kısmen |
| Fiyat (başlangıç) | Freemium | $12.50/ay | Ücretsiz | $9.99/ay |

Promptly PRD v1.0 · Confidential · Tüm haklar saklıdır · April 2026