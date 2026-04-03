import Combine
import Foundation

/// Sabit API kökü (PromptlyConfig) + Clerk JWT veya sunucu anahtarı (DESKTOP_APIKEY).
final class DesktopSettings: ObservableObject {
    private enum K {
        static let apiBaseOverride = "promptly.apiBaseOverride"
        static let sessionToken = "promptly.sessionToken"
        static let legacyDesktopKey = "promptly.legacyDesktopKey"
        static let autoUpload = "promptly.autoUpload"
    }

    /// Çoğu kurulumda boş: `PromptlyConfig.defaultAPIBase` kullanılır. Sadece özel sunucu için doldur.
    @Published var apiBaseOverride: String {
        didSet { UserDefaults.standard.set(apiBaseOverride, forKey: K.apiBaseOverride) }
    }

    /// Bearer: Clerk oturum JWT (Clerk panosu / geliştirme araçlarından yapıştırılabilir).
    @Published var sessionToken: String {
        didSet { UserDefaults.standard.set(sessionToken, forKey: K.sessionToken) }
    }

    /// İsteğe bağlı: sunucudaki `DESKTOP_APIKEY` (Clerk jetonu yoksa eski yöntem).
    @Published var legacyDesktopKey: String {
        didSet { UserDefaults.standard.set(legacyDesktopKey, forKey: K.legacyDesktopKey) }
    }

    @Published var autoUploadAfterRecording: Bool {
        didSet { UserDefaults.standard.set(autoUploadAfterRecording, forKey: K.autoUpload) }
    }

    init() {
        apiBaseOverride =
            UserDefaults.standard.string(forKey: K.apiBaseOverride) ?? ""
        sessionToken = UserDefaults.standard.string(forKey: K.sessionToken) ?? ""
        legacyDesktopKey =
            UserDefaults.standard.string(forKey: K.legacyDesktopKey) ?? ""
        autoUploadAfterRecording = UserDefaults.standard.bool(forKey: K.autoUpload)
    }

    /// Gerçek istek kökü: override doluysa o, değilse varsayılan paket URL’si.
    var resolvedAPIBase: String {
        let o = apiBaseOverride.trimmingCharacters(in: .whitespacesAndNewlines)
        if !o.isEmpty { return o.trimmingCharacters(in: CharacterSet(charactersIn: "/")) }
        return PromptlyConfig.defaultAPIBase.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    var canUpload: Bool {
        guard URL(string: resolvedAPIBase) != nil else { return false }
        let t = sessionToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let l = legacyDesktopKey.trimmingCharacters(in: .whitespacesAndNewlines)
        return !t.isEmpty || !l.isEmpty
    }

}
