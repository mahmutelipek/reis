import Foundation

/// Tek dağıtım kökü: release’te kendi Vercel / üretim URL’ini buraya yazın (kullanıcı başına değil, uygulama başına).
enum PromptlyConfig {
    #if DEBUG
        static let defaultAPIBase = "http://127.0.0.1:3000"
    #else
        /// Üretim Promptly web kökü (sonunda `/` olmadan).
        static let defaultAPIBase = "https://YOUR-PROJECT.vercel.app"
    #endif
}
