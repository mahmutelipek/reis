import AppKit
import SwiftUI

@main
struct PromptlyDesktopApp: App {
    @StateObject private var recorder = ScreenRecorder()
    @StateObject private var desktop = DesktopSettings()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(recorder)
                .environmentObject(desktop)
        }
        .defaultSize(width: 560, height: 480)

        Window("Prompter", id: "prompter") {
            PrompterPlaceholderView()
        }
        .defaultSize(width: 380, height: 520)
    }
}

struct ContentView: View {
    @EnvironmentObject private var recorder: ScreenRecorder
    @EnvironmentObject private var desktop: DesktopSettings
    @Environment(\.openWindow) private var openWindow

    @State private var uploadLog: String = ""
    @State private var uploadBusy = false
    @State private var uploadProgress: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Promptly")
                .font(.largeTitle.bold())

            Text(
                "Kayıt sırasında bu işlemin tüm pencereleri yakalamadan çıkarılır. Web ile paylaşım için aşağıdaki API bilgilerini doldur (sunucuda `DESKTOP_APIKEY` ve `DESKTOP_OWNER_CLERK_USER_ID`)."
            )
            .font(.callout)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)

            GroupBox("Web bağlantısı (sonradan da girilebilir)") {
                VStack(alignment: .leading, spacing: 8) {
                    TextField("API kökü (örn. http://localhost:3000)", text: $desktop.apiBase)
                        .textFieldStyle(.roundedBorder)
                    SecureField("Desktop API anahtarı", text: $desktop.apiKey)
                        .textFieldStyle(.roundedBorder)
                    Toggle("Kayıt bitince otomatik yükle", isOn: $desktop.autoUploadAfterRecording)
                }
                .padding(4)
            }

            HStack(spacing: 12) {
                Button("Prompter penceresi") {
                    openWindow(id: "prompter")
                }
                .keyboardShortcut("p", modifiers: [.command])

                if recorder.isRecording {
                    Button("Durdur", role: .destructive) {
                        recorder.stopRecording()
                    }
                } else {
                    Button("Kaydı başlat") {
                        recorder.startRecording()
                    }
                    .keyboardShortcut("r", modifiers: [.command])
                }

                if let url = recorder.lastRecordingURL, !recorder.isRecording, desktop.canUpload {
                    Button(
                        uploadBusy
                            ? (uploadProgress.map { String(format: "Yükleniyor… %d%%", Int($0 * 100)) } ?? "Yükleniyor…")
                            : "Son kaydı yükle"
                    ) {
                        Task { await upload(url) }
                    }
                    .disabled(uploadBusy)
                }
            }

            Text(recorder.status)
                .font(.footnote)
                .foregroundStyle(recorder.status.contains("Hata") ? Color.red : Color.secondary)
                .lineLimit(4)

            if !uploadLog.isEmpty {
                Text(uploadLog)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
            }

            if let url = recorder.lastRecordingURL, !recorder.isRecording {
                Button("Finder’da göster") {
                    NSWorkspace.shared.activateFileViewerSelecting([url])
                }
            }

            Spacer()
        }
        .padding(24)
        .frame(minWidth: 520, minHeight: 460)
        .onChange(of: recorder.lastRecordingURL) { newURL in
            guard desktop.autoUploadAfterRecording,
                  desktop.canUpload,
                  let file = newURL,
                  !recorder.isRecording
            else { return }
            Task { await upload(file) }
        }
    }

    private func upload(_ file: URL) async {
        guard desktop.canUpload else { return }
        uploadBusy = true
        uploadProgress = nil
        let bytes = (try? FileManager.default.attributesOfItem(atPath: file.path)[.size] as? NSNumber)?.int64Value ?? 0
        let mb = Double(bytes) / 1_048_576
        uploadLog = String(format: "Dosya ~%.1f MB — sunucuya gönderiliyor…", mb)
        defer {
            uploadBusy = false
            uploadProgress = nil
        }
        do {
            let title = file.deletingPathExtension().lastPathComponent
            let r = try await DesktopUpload.uploadRecording(
                fileURL: file,
                title: title,
                apiBase: desktop.apiBase,
                apiKey: desktop.apiKey,
                onProgress: { p in
                    uploadProgress = p
                }
            )
            let base = desktop.apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            uploadLog = "Tamam: \(base)/v/\(r.shareSlug)\nMux işlemesi (oynatılabilir hale gelmesi) birkaç dakika sürebilir."
        } catch {
            uploadLog = error.localizedDescription
        }
    }
}
