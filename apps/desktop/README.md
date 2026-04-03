# Promptly Desktop (macOS)

Swift Package Manager ile oluşturulmuş minimal masaüstü kabuğu. Üretimde:

- `ScreenCaptureKit` + `SCContentFilter` ile capture dışı overlay
- `SFSpeechRecognizer` ile on-device senkron prompter
- Sparkle + Developer ID imzalı DMG dağıtımı (bkz. kök README / PRD)

```bash
# Önerilen: Vercel kökünü tek satır yaz (`.promptly-api-base.example` → `.promptly-api-base`)
./run.sh

# veya doğrudan (URL’yi kendin ver):
export PROMPTLY_API_BASE=https://senin-uygulaman.vercel.app
swift run PromptlyDesktop
```

```bash
swift build -c release
# Çalıştırılabilir: .build/release/PromptlyDesktop
```

**Web kökü sırası:** `PROMPTLY_API_BASE` ortam değişkeni → `apps/desktop/.promptly-api-base` (yalnızca `./run.sh` ile) → `PromptlyConfig.swift` içindeki `embeddedFallbackRoot` (Xcode yoksa burayı mutlaka düzenle). Yerel Next için: `export PROMPTLY_API_BASE=http://127.0.0.1:3000`.

**Oturum:** Uygulamada **Tarayıcıda giriş yap** → `/desktop/connect` (Clerk giriş/kayıt, kütüphane ile aynı kart düzeni) → **Bağlantıyı oluştur** → uygulamada aç veya pano. Sunucuda `DESKTOP_SESSION_SECRET` gerekli (`apps/web/.env.example`). `promptly://` için `Promptly-Info.plist.example` + Xcode; yoksa pano yeterli.

İlk kayıtta macOS **Sistem Ayarları → Gizlilik ve Güvenlik → Ekran Kaydı** (ve gerekirse **Mikrofon**) için Promptly’ye izin ver.

- **Kaydı başlat:** Ana pencerede uygulama pencereleri yakalamadan çıkarılır; istersen ayrı **Prompter** penceresini `⌘P` ile aç.
- Çıktı dosyası: `Filmler` klasöründe `Promptly-*.mp4`.

Xcode: `Package.swift` içeren bu klasörü açıp `PromptlyDesktop` scheme ile çalıştırın. Yayın öncesi `Promptly-Info.plist.example` içeriğini hedef `Info.plist` ile birleştirin (izin metinleri + `promptly` URL şeması). Web’e yükleme: `POST /api/mux/upload` — tarayıcıdan alınan masaüstü oturum jetonu (Bearer) veya geliştirici anahtarı; bkz. kök `README.md` ve `apps/web/.env.example`.
