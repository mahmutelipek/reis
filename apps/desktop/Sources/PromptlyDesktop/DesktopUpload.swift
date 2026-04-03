import Foundation

enum DesktopUploadError: LocalizedError {
    case badResponse(Int, String)
    case invalidURL
    case missingAuth
    case uploadFailed(Error?)

    var errorDescription: String? {
        switch self {
        case let .badResponse(code, body):
            return "Sunucu \(code): \(body.prefix(200))"
        case .invalidURL:
            return "Geçersiz API adresi."
        case .missingAuth:
            return "Oturum süresi dolmuş veya geçersiz. Uygulamayı kapatıp giriş ekranından tekrar Clerk ile bağlan."
        case let .uploadFailed(err):
            return err?.localizedDescription ?? "Mux yükleme başarısız."
        }
    }
}

struct MuxUploadInitResponse: Decodable {
    let uploadId: String
    let url: String
    let videoId: String
    let shareSlug: String
}

/// Mux PUT için ilerleme + uzun süren büyük dosyalar (varsayılan URLSession zaman aşımı yetmez).
private final class MuxPutUploader: NSObject, URLSessionTaskDelegate {
    private var session: URLSession!
    private var continuation: CheckedContinuation<Void, Error>?
    private let onProgress: ((Double) -> Void)?

    init(onProgress: ((Double) -> Void)?) {
        self.onProgress = onProgress
        super.init()
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 600
        cfg.timeoutIntervalForResource = 7200
        cfg.waitsForConnectivity = true
        self.session = URLSession(configuration: cfg, delegate: self, delegateQueue: .main)
    }

    func upload(request: URLRequest, fileURL: URL) async throws {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            self.continuation = cont
            self.session.uploadTask(with: request, fromFile: fileURL).resume()
        }
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didSendBodyData bytesSent: Int64,
        totalBytesSent: Int64,
        totalBytesExpectedToSend: Int64
    ) {
        guard totalBytesExpectedToSend > 0 else { return }
        let p = Double(totalBytesSent) / Double(totalBytesExpectedToSend)
        onProgress?(min(1, max(0, p)))
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let cont = continuation else { return }
        continuation = nil
        if let error {
            cont.resume(throwing: error)
        } else if let http = task.response as? HTTPURLResponse, !(200 ... 299).contains(http.statusCode) {
            cont.resume(throwing: DesktopUploadError.badResponse(http.statusCode, "Mux PUT"))
        } else {
            cont.resume()
        }
        session.finishTasksAndInvalidate()
    }
}

enum DesktopUpload {
    private static let legacyKeyHeader = "x-promptly-desktop-key"

    /// 1) POST ile Mux PUT URL al 2) dosyayı PUT et (ilerleme isteğe bağlı).
    /// `sessionToken`: Promptly masaüstü oturumu (Bearer). `legacyDesktopKey`: DESKTOP_APIKEY yedeği.
    static func uploadRecording(
        fileURL: URL,
        title: String,
        apiBase: String,
        sessionToken: String,
        legacyDesktopKey: String? = nil,
        onProgress: ((Double) -> Void)? = nil
    ) async throws -> MuxUploadInitResponse {
        let trimmed = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let base = URL(string: trimmed) else {
            throw DesktopUploadError.invalidURL
        }

        let endpoint = base.appendingPathComponent("api/mux/upload")

        var create = URLRequest(url: endpoint)
        create.httpMethod = "POST"
        create.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let token = sessionToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let legacy = legacyDesktopKey?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if token.isEmpty && legacy.isEmpty {
            throw DesktopUploadError.missingAuth
        }
        if !token.isEmpty {
            create.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if !legacy.isEmpty {
            create.setValue(legacy, forHTTPHeaderField: legacyKeyHeader)
        }

        let body: [String: String] = ["title": title]
        create.httpBody = try JSONEncoder().encode(body)

        let createCfg = URLSessionConfiguration.default
        createCfg.timeoutIntervalForRequest = 120
        let createSession = URLSession(configuration: createCfg)

        let (data, res) = try await createSession.data(for: create)
        guard let http = res as? HTTPURLResponse else {
            throw DesktopUploadError.badResponse(-1, "")
        }
        guard (200 ... 299).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw DesktopUploadError.badResponse(http.statusCode, text)
        }

        let decoded = try JSONDecoder().decode(MuxUploadInitResponse.self, from: data)

        guard let putURL = URL(string: decoded.url) else {
            throw DesktopUploadError.invalidURL
        }

        var put = URLRequest(url: putURL)
        put.httpMethod = "PUT"
        put.setValue("video/mp4", forHTTPHeaderField: "Content-Type")

        let uploader = MuxPutUploader(onProgress: onProgress)
        do {
            try await uploader.upload(request: put, fileURL: fileURL)
        } catch {
            throw DesktopUploadError.uploadFailed(error)
        }

        return decoded
    }
}
