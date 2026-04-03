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
            }
            .environmentObject(recorder)
            .environmentObject(desktop)
            .onOpenURL { url in
                desktop.handleConnectURL(url)
            }
        }
        .defaultSize(width: 560, height: 520)
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

    @State private var uploadLog: String = ""
    @State private var uploadBusy = false
    @State private var uploadProgress: Double?

    private var hasCredential: Bool {
        desktop.hasValidDesktopSession
    }

    var body: some View {
        Group {
            if hasCredential {
                signedInForm
            } else {
                DesktopConnectGateView()
            }
        }
        .navigationTitle(hasCredential ? "Promptly" : "")
    }

    @ViewBuilder
    private var signedInForm: some View {
        DesktopRecordingHubView(
            uploadLog: $uploadLog,
            uploadBusy: $uploadBusy,
            uploadProgress: $uploadProgress,
            uploadAction: upload
        )
        .onChange(of: recorder.lastRecordingURL) { newURL in
            guard desktop.hasValidDesktopSession,
                  desktop.autoUploadAfterRecording,
                  desktop.canUpload,
                  let file = newURL,
                  !recorder.isRecording
            else { return }
            Task { await upload(file) }
        }
    }

    private func upload(_ file: URL) async {
        guard desktop.hasValidDesktopSession, desktop.canUpload else { return }
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
