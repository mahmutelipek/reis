import AppKit
import SwiftUI

@main
struct PromptlyDesktopApp: App {
    @StateObject private var recorder = ScreenRecorder()
    @StateObject private var desktop = DesktopSettings()

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ContentView()
                    .navigationTitle("Promptly")
            }
            .environmentObject(recorder)
            .environmentObject(desktop)
            .onOpenURL { url in
                desktop.handleConnectURL(url)
            }
        }
        .defaultSize(width: 720, height: 640)
        .windowResizability(.contentSize)

        Window("Prompter", id: "prompter") {
            NavigationStack {
                PrompterPlaceholderView()
                    .navigationTitle("Prompter")
            }
        }
        .defaultSize(width: 400, height: 540)
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
        Form {
            Section {
                if PromptlyConfig.looksLikePlaceholder {
                    Label {
                        Text(
                            "Sunucu adresi eksik: `PromptlyConfig.swift` veya `.promptly-api-base` / `PROMPTLY_API_BASE` ayarla."
                        )
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                    } icon: {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                } else {
                    Label {
                        Text(
                            "Aşağıdan tarayıcıda giriş yap; bağlantıyı oluşturup bu uygulamaya aktar. Kayıtlar web kütüphanende."
                        )
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    } icon: {
                        Image(systemName: "link.circle.fill")
                            .foregroundStyle(.blue.gradient)
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            } header: {
                Text("Özet")
            }

            Section {
                LabeledContent("Sunucu") {
                    Text(desktop.resolvedAPIBase)
                        .font(.body.monospaced())
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                        .multilineTextAlignment(.trailing)
                        .lineLimit(3)
                }

                HStack {
                    if desktop.sessionToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Label("Oturum yok", systemImage: "person.crop.circle.badge.questionmark")
                            .foregroundStyle(.secondary)
                    } else {
                        Label("Bağlı", systemImage: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                    }
                    Spacer()
                    Button("Tarayıcıda giriş yap…") {
                        if let url = desktop.browserConnectURL {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .keyboardShortcut("l", modifiers: [.command])
                    if !desktop.sessionToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button("Çıkış") {
                            desktop.clearSession()
                        }
                        .buttonStyle(.borderless)
                    }
                }

                Button {
                    if let s = NSPasteboard.general.string(forType: .string)?
                        .trimmingCharacters(in: .whitespacesAndNewlines),
                       !s.isEmpty {
                        desktop.sessionToken = s
                    }
                } label: {
                    Label("Panodan bağlan", systemImage: "doc.on.clipboard")
                }
            } header: {
                Text("Hesap")
            }

            Section {
                DisclosureGroup("Gelişmiş") {
                    TextField("Özel API kökü", text: $desktop.apiBaseOverride)
                    SecureField("Oturum jetonu (pdtk1…)", text: $desktop.sessionToken)
                    SecureField("DESKTOP_APIKEY (yedek)", text: $desktop.legacyDesktopKey)
                }
                .padding(.top, 4)

                Toggle("Kayıt bitince otomatik yükle", isOn: $desktop.autoUploadAfterRecording)
            }

            Section {
                Button {
                    openWindow(id: "prompter")
                } label: {
                    Label("Prompter penceresi", systemImage: "text.bubble")
                }

                if recorder.isRecording {
                    Button(role: .destructive) {
                        recorder.stopRecording()
                    } label: {
                        Label("Kaydı durdur", systemImage: "stop.circle.fill")
                    }
                } else {
                    Button {
                        recorder.startRecording()
                    } label: {
                        Label("Kaydı başlat", systemImage: "record.circle")
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                }

                if let url = recorder.lastRecordingURL, !recorder.isRecording, desktop.canUpload {
                    Button {
                        Task { await upload(url) }
                    } label: {
                        if uploadBusy {
                            if let p = uploadProgress {
                                Label(
                                    "Yükleniyor… \(Int(p * 100))%",
                                    systemImage: "arrow.up.circle"
                                )
                            } else {
                                Label("Yükleniyor…", systemImage: "arrow.up.circle")
                            }
                        } else {
                            Label("Son kaydı yükle", systemImage: "icloud.and.arrow.up")
                        }
                    }
                    .disabled(uploadBusy)
                }

                if let url = recorder.lastRecordingURL, !recorder.isRecording {
                    Button {
                        NSWorkspace.shared.activateFileViewerSelecting([url])
                    } label: {
                        Label("Finder’da göster", systemImage: "folder")
                    }
                }
            } header: {
                Text("Kayıt")
            }

            Section {
                Text(recorder.status)
                    .font(.subheadline)
                    .foregroundStyle(recorder.status.contains("Hata") ? Color.red : Color.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if !uploadLog.isEmpty {
                    Text(uploadLog)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } header: {
                Text("Durum")
            }
        }
        .formStyle(.grouped)
        .frame(minWidth: 560, minHeight: 500)
        .padding(.top, 8)
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
        uploadLog = String(format: "Dosya ~%.1f MB — gönderiliyor…", mb)
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
            uploadLog = "Tamam: \(base)/v/\(r.shareSlug)\nMux işlemi birkaç dakika sürebilir."
        } catch {
            uploadLog = error.localizedDescription
        }
    }
}
