# Promptly Desktop (macOS)

Swift Package Manager ile oluşturulmuş minimal masaüstü kabuğu. Üretimde:

- `ScreenCaptureKit` + `SCContentFilter` ile capture dışı overlay
- `SFSpeechRecognizer` ile on-device senkron prompter
- Sparkle + Developer ID imzalı DMG dağıtımı (bkz. kök README / PRD)

```bash
swift build -c release
# Çalıştırılabilir: .build/release/PromptlyDesktop
```

İlk kayıtta macOS **Sistem Ayarları → Gizlilik ve Güvenlik → Ekran Kaydı** (ve gerekirse **Mikrofon**) için Promptly’ye izin ver.

- **Kaydı başlat:** Ana pencerede uygulama pencereleri yakalamadan çıkarılır; istersen ayrı **Prompter** penceresini `⌘P` ile aç.
- Çıktı dosyası: `Filmler` klasöründe `Promptly-*.mp4`.

Xcode: `Package.swift` içeren bu klasörü açıp `PromptlyDesktop` scheme ile çalıştırın. Yayın öncesi izin metinleri için `Promptly-Info.plist.example` içeriğini hedef `Info.plist` ile birleştirin (SwiftPM executable bu dosyayı pakete gömemez).
