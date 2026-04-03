import Foundation

/// Web API kökü (sonunda `/` yok).
///
/// Öncelik:
/// 1) Ortam değişkeni `PROMPTLY_API_BASE` (önerilir), örn. `export PROMPTLY_API_BASE=https://senin-uygulaman.vercel.app`
/// 2) `apps/desktop/.promptly-api-base` dosyası — `./run.sh` otomatik okur
/// 3) Aşağıdaki `embeddedFallbackRoot` — **kendi Vercel kökünle değiştir** (Xcode yoksa burası kritik)
enum PromptlyConfig {
    /// Xcode yokken burayı tek sefer düzenle: dağıtım kökün (örn. https://reis.vercel.app)
    private static let embeddedFallbackRoot = "https://YOUR-APP.vercel.app"

    static var defaultAPIBase: String {
        if let raw = ProcessInfo.processInfo.environment["PROMPTLY_API_BASE"]?
            .trimmingCharacters(in: .whitespacesAndNewlines),
            !raw.isEmpty
        {
            return trimSlash(raw)
        }
        let path = FileManager.default.currentDirectoryPath + "/.promptly-api-base"
        if let data = FileManager.default.contents(atPath: path),
           let s = String(data: data, encoding: .utf8)?
           .trimmingCharacters(in: .whitespacesAndNewlines),
           !s.isEmpty, !s.hasPrefix("#")
        {
            return trimSlash(s)
        }
        return trimSlash(embeddedFallbackRoot)
    }

    private static func trimSlash(_ s: String) -> String {
        s.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    /// Yerel `npm run dev` kullanıyorsan terminalde: `export PROMPTLY_API_BASE=http://127.0.0.1:3000`
    static var looksLikePlaceholder: Bool {
        defaultAPIBase.contains("YOUR-APP") || defaultAPIBase == "https://YOUR-APP.vercel.app"
    }
}
