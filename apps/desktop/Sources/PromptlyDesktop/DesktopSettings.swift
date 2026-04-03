import Combine
import Foundation

/// Sabit API kökü (PromptlyConfig) + tarayıcıdan /desktop/connect ile alınan oturum jetonu veya DESKTOP_APIKEY.
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

    /// Bearer: /desktop/connect ile üretilen Promptly masaüstü oturumu (pdtk1…).
    @Published var sessionToken: String {
        didSet { UserDefaults.standard.set(sessionToken, forKey: K.sessionToken) }
    }

    /// İsteğe bağlı: sunucudaki `DESKTOP_APIKEY` (geliştirici yedeği).
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

    /// `promptly://connect?token=...` (Info.plist’te URL scheme kayıtlı olmalı).
    func handleConnectURL(_ url: URL) {
        guard url.scheme?.lowercased() == "promptly" else { return }
        guard url.host?.lowercased() == "connect" else { return }
        guard
            let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems,
            let token = items.first(where: { $0.name == "token" })?.value?.trimmingCharacters(in: .whitespacesAndNewlines),
            !token.isEmpty
        else { return }
        sessionToken = token
    }

    func clearSession() {
        sessionToken = ""
    }

    var browserConnectURL: URL? {
        let base = resolvedAPIBase.trimmingCharacters(in: .whitespacesAndNewlines)
        return URL(string: base + "/desktop/connect")
    }

}
