# Promptly

Kurumsal async video + görünmez, ses-senkron teleprompter. Bu repo monorepo yapısında:

- **apps/web** — Next.js: kütüphane, paylaşım, Mux/Clerk/Drizzle
- **apps/desktop** — macOS (Swift): kayıt + prompter (alpha geliştiriliyor)
- **packages/shared** — paylaşılan TypeScript tipleri (ileride)

## Gereksinimler

- Node.js 20+
- npm (workspaces)
- macOS 13+ (masaüstü geliştirme için)

## Web

```bash
cp apps/web/.env.example apps/web/.env.local
# Clerk, DATABASE_URL, Mux anahtarlarını doldur

npm install
npm run dev
```

Uygulama varsayılan: [http://localhost:3000](http://localhost:3000)

Veritabanı şeması (Neon vb. bağlandıktan sonra):

```bash
cd apps/web && npm run db:push
```

**Not:** Clerk anahtarları olmadan da `npm run build` çalışır (kurulum mesajı gösterilir). Gerçek kullanım için `.env.local` şart.

**Mux webhooks** şu olayları içermeli: `video.asset.ready`, `video.asset.static_rendition.ready` (transcript için), `video.asset.errored`, `video.upload.cancelled`. Transcript için ayrıca `OPENAI_API_KEY` gerekir.

**İzleyici sayısı:** `/v/...` sayfası `POST /api/public/views` ile oturum başına bir kayıt günceller; kütüphanede “izleyici oturumu” bunu gösterir. **Masaüstü tarayıcı girişi** için `desktop_handoffs` tablosu eklenir; şema değişince `npm run db:push` tekrar çalıştır.

**Paylaşım şifresi:** kütüphanede videoya şifre verebilirsin; izleyici `/v/...` üzerinde doğrular. `SHARE_UNLOCK_SECRET` (≥16 karakter) `.env.local` içinde olmalı.

**Embed:** `/v/{slug}/embed` sadece oynatıcı içerir; `Content-Security-Policy: frame-ancestors *` ile harici sitelere gömülebilir. Tam iframe kodu kütüphanede kopyalanır (`NEXT_PUBLIC_APP_URL` gerekli).

**Prod kontrol listesi:** `.env` doldur, `db:push`, Mux webhooks, `SHARE_UNLOCK_SECRET` (şifreli paylaşım lazımsa), deploy ortamında `NEXT_PUBLIC_APP_URL` gerçek domain, `/api/health` ile canlılık kontrolü.

### Vercel deploy

Repo: [github.com/mahmutelipek/reis](https://github.com/mahmutelipek/reis). Vercel’de **Add New Project** → bu repoyu içe aktar.

- **Root Directory:** `apps/web` (monorepo; Next.js bu klasörde).
- **Environment Variables:** `apps/web/.env.example` içindeki tüm anahtarları üretim değerleriyle ekle (`DATABASE_URL`, Clerk, Mux, `MUX_WEBHOOK_SECRET`, `SHARE_UNLOCK_SECRET`, `NEXT_PUBLIC_APP_URL`, `MUX_CORS_ORIGIN` = deploy kök URL’in, vb.).
- **Mux webhook URL** (ilk deploy’dan sonra): `https://<vercel-proje-url’n>/api/webhooks/mux` — Mux Dashboard’da webhook’u bu adrese güncelle; `MUX_WEBHOOK_SECRET`’i Vercel env’e yaz.
- Şema: deploy sonrası bir kez `DATABASE_URL` ile `cd apps/web && npm run db:push` (lokalden veya CI) çalıştır.

## Masaüstü

Ekran kaydı (ScreenCaptureKit) + ayrı Prompter penceresi; kayıtta uygulama pencereleri otomatik hariç tutulur. İlk çalıştırmada macOS ekran kaydı iznini isteyecek.

```bash
cd apps/desktop
swift build
open .build/debug/PromptlyDesktop
```

Xcode ile açmak için `Package.swift` içeren klasörü açın.

**Web’e yükleme:** Önerilen: uygulamada **E-posta ile giriş yap** → sistem tarayıcı oturumunda Clerk ile giriş → JWT otomatik kaydedilir (`desktop_handoffs` tablosu için üretimde `npm run db:push` gerekir). Xcode hedefine `promptly` URL şeması ekleyin (`Promptly-Info.plist.example`). Yedek: web `/desktop/token` ile jeton yapıştırma. Geliştirici yedeği: `.env.local` içinde `DESKTOP_APIKEY` + `DESKTOP_OWNER_CLERK_USER_ID` ve uygulamada aynı anahtar.

## PRD

[Promptly_PRD_v1.0.docx.md](./Promptly_PRD_v1.0.docx.md)
