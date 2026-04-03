import AppKit
import AuthenticationServices
import Foundation

enum DesktopSignInError: LocalizedError {
    case badURL
    case noCode
    case canceled
    case startFailed
    case exchangeFailed(Int, String)
    case invalidPayload

    var errorDescription: String? {
        switch self {
        case .badURL:
            return "Geçersiz sunucu adresi."
        case .noCode:
            return "Girişten sonra kod alınamadı. URL şeması «promptly» Info.plist’te tanımlı mı?"
        case .canceled:
            return "Giriş iptal edildi."
        case .startFailed:
            return "Sistem giriş penceresi açılamadı."
        case let .exchangeFailed(code, text):
            return "Oturum alınamadı (\(code)): \(String(text.prefix(200)))"
        case .invalidPayload:
            return "Sunucu yanıtı geçersiz."
        }
    }
}

private func normalizedAPIBase(_ apiBase: String) -> String {
    apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
}

/// Tarayıcıda Clerk (e-posta) ile giriş → `promptly://oauth?code=` → JWT.
@MainActor
enum DesktopSignIn {
    static func signInWithBrowser(apiBase: String, anchorWindow: NSWindow?) async throws -> String {
        let base = normalizedAPIBase(apiBase)
        guard let startURL = URL(string: base + "/desktop/finish") else {
            throw DesktopSignInError.badURL
        }

        let code = try await withCheckedThrowingContinuation { (cont: CheckedContinuation<String, Error>) in
            let anchor = AnchorProvider(window: anchorWindow)
            let session = ASWebAuthenticationSession(
                url: startURL,
                callbackURLScheme: "promptly"
            ) { callbackURL, error in
                if let error {
                    if let authErr = error as? ASWebAuthenticationSessionError,
                       authErr.code == .canceledLogin
                    {
                        cont.resume(throwing: DesktopSignInError.canceled)
                    } else {
                        cont.resume(throwing: error)
                    }
                    return
                }
                guard let callbackURL,
                      let items = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
                      .queryItems,
                      let c = items.first(where: { $0.name == "code" })?.value,
                      !c.isEmpty
                else {
                    cont.resume(throwing: DesktopSignInError.noCode)
                    return
                }
                cont.resume(returning: c)
            }
            session.presentationContextProvider = anchor
            session.prefersEphemeralWebBrowserSession = false
            if !session.start() {
                cont.resume(throwing: DesktopSignInError.startFailed)
            }
        }

        return try await exchangeHandoff(code: code, apiBase: base)
    }

    private static func exchangeHandoff(code: String, apiBase: String) async throws -> String {
        var parts = URLComponents(string: apiBase + "/api/desktop/handoff")
        parts?.queryItems = [URLQueryItem(name: "id", value: code)]
        guard let url = parts?.url else { throw DesktopSignInError.badURL }

        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 45

        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw DesktopSignInError.invalidPayload }
        guard (200 ... 299).contains(http.statusCode) else {
            let t = String(data: data, encoding: .utf8) ?? ""
            throw DesktopSignInError.exchangeFailed(http.statusCode, t)
        }

        struct Body: Decodable {
            let token: String
        }
        let body = try JSONDecoder().decode(Body.self, from: data)
        let tok = body.token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !tok.isEmpty else { throw DesktopSignInError.invalidPayload }
        return tok
    }
}

private final class AnchorProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    private weak var window: NSWindow?

    init(window: NSWindow?) {
        self.window = window
        super.init()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let w = window { return w }
        if let k = NSApplication.shared.keyWindow { return k }
        if let w = NSApplication.shared.mainWindow { return w }
        if let w = NSApplication.shared.windows.first { return w }
        assertionFailure("presentationAnchor: pencere yok")
        return NSWindow()
    }
}
