import Combine
import Foundation

/// Web uç noktası + masaüstü anahtarı — `UserDefaults` ile saklanır (bağlantıyı sen tamamlarsın).
final class DesktopSettings: ObservableObject {
    private enum K {
        static let apiBase = "promptly.apiBase"
        static let apiKey = "promptly.apiKey"
        static let autoUpload = "promptly.autoUpload"
    }

    @Published var apiBase: String {
        didSet { UserDefaults.standard.set(apiBase, forKey: K.apiBase) }
    }

    @Published var apiKey: String {
        didSet { UserDefaults.standard.set(apiKey, forKey: K.apiKey) }
    }

    @Published var autoUploadAfterRecording: Bool {
        didSet { UserDefaults.standard.set(autoUploadAfterRecording, forKey: K.autoUpload) }
    }

    init() {
        let base = UserDefaults.standard.string(forKey: K.apiBase) ?? "http://localhost:3000"
        apiBase = base.trimmingCharacters(in: .whitespacesAndNewlines)
        apiKey = UserDefaults.standard.string(forKey: K.apiKey) ?? ""
        autoUploadAfterRecording = UserDefaults.standard.bool(forKey: K.autoUpload)
    }

    var canUpload: Bool {
        URL(string: apiBase.trimmingCharacters(in: .whitespacesAndNewlines)) != nil
            && !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
