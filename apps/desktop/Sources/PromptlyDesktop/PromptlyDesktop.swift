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
    @State private var signInBusy = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Promptly")
                .font(.largeTitle.bold())

            Text(
                "Kayıtlar web’deki kütüphanende ve paylaşım sayfasında görünür. «E-posta ile giriş yap» ile tarayıcıda Clerk hesabınla (e-posta) oturum açarsın; jeton uygulamaya otomatik yazılır. Xcode ile derlerken Info.plist’e URL şeması «promptly» eklemen gerekir (örnek repoda Promptly-Info.plist.example)."
            )
            .font(.callout)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)

            GroupBox("Hesap ve yükleme") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Sunucu")
                            .frame(width: 88, alignment: .leading)
                        Text(desktop.resolvedAPIBase)
                            .font(.callout)
                            .textSelection(.enabled)
                            .foregroundStyle(.secondary)
                    }
                    Button {
                        Task {
                            signInBusy = true
                            defer { signInBusy = false }
                            do {
                                let tok = try await DesktopSignIn.signInWithBrowser(
                                    apiBase: desktop.resolvedAPIBase,
                                    anchorWindow: NSApp.keyWindow
                                )
                                desktop.sessionToken = tok
                                uploadLog = "Giriş tamam. Videolar bu Clerk hesabına yüklenir."
                            } catch {
                                uploadLog = error.localizedDescription
                            }
                        }
                    } label: {
                        if signInBusy {
                            Text("Giriş penceresi açık…")
                        } else {
                            Text("E-posta ile giriş yap (tarayıcı)")
                        }
                    }
                    .disabled(signInBusy || URL(string: desktop.resolvedAPIBase) == nil)

                    Button("Jetonu elle kopyala (yedek)") {
                        if let url = desktop.desktopTokenPageURL {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .disabled(desktop.desktopTokenPageURL == nil)

                    SecureField("Oturum jetonu (yedek: elle yapıştır)", text: $desktop.sessionToken)
                        .textFieldStyle(.roundedBorder)

                    DisclosureGroup("Gelişmiş") {
                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Özel API kökü (boşsa varsayılan)", text: $desktop.apiBaseOverride)
                                .textFieldStyle(.roundedBorder)
                            SecureField("Yedek: DESKTOP_APIKEY (Clerk yoksa)", text: $desktop.legacyDesktopKey)
                                .textFieldStyle(.roundedBorder)
                        }
                        .padding(.top, 6)
                    }

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
                apiBase: desktop.resolvedAPIBase,
                sessionToken: desktop.sessionToken,
                legacyDesktopKey: desktop.legacyDesktopKey.isEmpty ? nil : desktop.legacyDesktopKey,
                onProgress: { p in
                    uploadProgress = p
                }
            )
            let base = desktop.resolvedAPIBase
            uploadLog = "Tamam: \(base)/v/\(r.shareSlug)\nMux işlemesi (oynatılabilir hale gelmesi) birkaç dakika sürebilir."
        } catch {
            uploadLog = error.localizedDescription
        }
    }
}
