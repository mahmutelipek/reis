import Foundation

enum DesktopUploadError: LocalizedError {
    case badResponse(Int, String)
    case invalidURL

    var errorDescription: String? {
        switch self {
        case let .badResponse(code, body):
            return "Sunucu \(code): \(body.prefix(200))"
        case .invalidURL:
            return "Geçersiz API adresi."
        }
    }
}

struct MuxUploadInitResponse: Decodable {
    let uploadId: String
    let url: String
    let videoId: String
    let shareSlug: String
}

enum DesktopUpload {
    private static let keyHeader = "x-promptly-desktop-key"

    /// 1) POST ile Mux PUT URL al 2) dosyayı PUT et
    static func uploadRecording(
        fileURL: URL,
        title: String,
        apiBase: String,
        apiKey: String
    ) async throws -> MuxUploadInitResponse {
        let trimmed = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let base = URL(string: trimmed) else {
            throw DesktopUploadError.invalidURL
        }

        let endpoint = base.appendingPathComponent("api/desktop/mux-upload")

        var create = URLRequest(url: endpoint)
        create.httpMethod = "POST"
        create.setValue("application/json", forHTTPHeaderField: "Content-Type")
        create.setValue(apiKey.trimmingCharacters(in: .whitespacesAndNewlines), forHTTPHeaderField: keyHeader)

        let body: [String: String] = ["title": title]
        create.httpBody = try JSONEncoder().encode(body)

        let (data, res) = try await URLSession.shared.data(for: create)
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

        let (_, putRes) = try await URLSession.shared.upload(for: put, fromFile: fileURL)
        guard let putHttp = putRes as? HTTPURLResponse, (200 ... 299).contains(putHttp.statusCode) else {
            let code = (putRes as? HTTPURLResponse)?.statusCode ?? -1
            throw DesktopUploadError.badResponse(code, "Mux PUT başarısız")
        }

        return decoded
    }
}
