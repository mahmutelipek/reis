import AppKit
import SwiftUI

/// Loom benzeri: sol şerit kontroller, ortada kaynak seçimi + büyük kayıt düğmesi.
struct DesktopRecordingHubView: View {
    @EnvironmentObject private var recorder: ScreenRecorder
    @EnvironmentObject private var desktop: DesktopSettings
    @Environment(\.openWindow) private var openWindow

    @Binding var uploadLog: String
    @Binding var uploadBusy: Bool
    @Binding var uploadProgress: Double?

    var uploadAction: (URL) async -> Void

    @State private var showSettings = false
    @State private var showWindowPicker = false

    private var isFullScreen: Bool {
        recorder.captureTargetWindowID == nil
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            leftRail
            centerPanel
                .padding(.leading, 6)
                .padding(.trailing, 18)
                .padding(.vertical, 16)
        }
        .frame(minWidth: 520, minHeight: 460)
        .background(Color(nsColor: .windowBackgroundColor))
        .sheet(isPresented: $showSettings) {
            DesktopSettingsSheet(uploadLog: $uploadLog)
                .environmentObject(recorder)
                .environmentObject(desktop)
        }
        .sheet(isPresented: $showWindowPicker) {
            DesktopWindowPickerSheet()
                .environmentObject(recorder)
        }
    }

    private var leftRail: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(red: 0.11, green: 0.11, blue: 0.13))
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)

            VStack(spacing: 18) {
                recordToggleButton

                RecordingTimerStrip()
                    .environmentObject(recorder)

                Rectangle()
                    .fill(Color.white.opacity(0.12))
                    .frame(width: 40, height: 1)

                railIconButton(
                    systemName: "trash",
                    label: "Sil",
                    enabled: recorder.lastRecordingURL != nil && !recorder.isRecording
                ) {
                    recorder.discardLastRecording()
                }

                railIconButton(systemName: "text.bubble", label: "Prompter", enabled: true) {
                    openWindow(id: "prompter")
                }

                Spacer(minLength: 0)

                railIconButton(systemName: "gearshape.fill", label: "Ayarlar", enabled: true) {
                    showSettings = true
                }
            }
            .padding(.vertical, 14)
        }
        .frame(width: 76)
        .padding(.vertical, 16)
        .padding(.leading, 12)
        .foregroundStyle(.white)
    }

    private var recordToggleButton: some View {
        Button {
            if recorder.isRecording {
                recorder.stopRecording()
            } else {
                recorder.startRecording()
            }
        } label: {
            ZStack {
                Circle()
                    .fill(recorder.isRecording ? Color.red.opacity(0.92) : Color.red)
                    .frame(width: 52, height: 52)
                    .shadow(color: .black.opacity(0.35), radius: 6, y: 3)
                if recorder.isRecording {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(.white)
                        .frame(width: 18, height: 18)
                }
            }
        }
        .buttonStyle(.plain)
        .help(recorder.isRecording ? "Kaydı durdur" : "Kaydı başlat")
    }

    private func railIconButton(
        systemName: String,
        label: String,
        enabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: systemName)
                    .font(.system(size: 18, weight: .medium))
                    .frame(width: 28, height: 28)
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .opacity(0.85)
            }
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.35)
        .help(label)
    }

    private var centerPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Kayıt")
                    .font(.title3.weight(.bold))
                Spacer()
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "gearshape")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .help("Ayarlar")
            }

            VStack(spacing: 10) {
                sourceRow(
                    icon: "display.2",
                    title: "Tüm ekran",
                    subtitle: "Promptly pencereleri kayıtta görünmez",
                    selected: isFullScreen
                ) {
                    recorder.captureTargetWindowID = nil
                    recorder.captureTargetWindowTitle = nil
                }

                if #available(macOS 14.0, *) {
                    sourceRow(
                        icon: "macwindow",
                        title: "Belirli pencere",
                        subtitle: windowSubtitle,
                        selected: !isFullScreen
                    ) {
                        showWindowPicker = true
                    }
                } else {
                    HStack(spacing: 12) {
                        Image(systemName: "macwindow")
                            .font(.title3)
                            .foregroundStyle(.tertiary)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Belirli pencere")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.tertiary)
                            Text("macOS 14 veya üzeri")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        Spacer()
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color.primary.opacity(0.03))
                    )
                }

                HStack(spacing: 12) {
                    Image(systemName: "camera.fill")
                        .font(.title3)
                        .foregroundStyle(.tertiary)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Kamera")
                            .font(.subheadline.weight(.semibold))
                        Text("Yok")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .strikethrough(true, color: .secondary)
                    }
                    Spacer()
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.primary.opacity(0.04))
                )

                HStack(spacing: 12) {
                    Image(systemName: "waveform")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Sistem sesi")
                            .font(.subheadline.weight(.semibold))
                        Text("Uygulama ve sistem çıkışı")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: $recorder.captureSystemAudio)
                        .labelsHidden()
                        .toggleStyle(.switch)
                        .disabled(recorder.isRecording)
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.primary.opacity(0.04))
                )
            }

            Button {
                if recorder.isRecording {
                    recorder.stopRecording()
                } else {
                    recorder.startRecording()
                }
            } label: {
                Text(recorder.isRecording ? "Kaydı durdur" : "Kaydı başlat")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(
                        recorder.isRecording
                            ? Color.gray.opacity(0.55)
                            : Color(red: 0.94, green: 0.33, blue: 0.18)
                    )
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .shadow(color: Color.black.opacity(0.12), radius: 8, y: 4)
            }
            .buttonStyle(.plain)
            .keyboardShortcut("r", modifiers: [.command])
            .padding(.top, 4)

            if let url = recorder.lastRecordingURL, !recorder.isRecording, desktop.canUpload {
                Button {
                    Task { await uploadAction(url) }
                } label: {
                    HStack {
                        if uploadBusy {
                            if let p = uploadProgress {
                                Text("Yükleniyor… \(Int(p * 100))%")
                            } else {
                                Text("Yükleniyor…")
                            }
                        } else {
                            Label("Son kaydı yükle", systemImage: "icloud.and.arrow.up")
                        }
                    }
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
                .buttonStyle(.borderedProminent)
                .disabled(uploadBusy)
            }

            if let url = recorder.lastRecordingURL, !recorder.isRecording {
                Button {
                    NSWorkspace.shared.activateFileViewerSelecting([url])
                } label: {
                    Label("Finder’da göster", systemImage: "folder")
                }
                .buttonStyle(.borderless)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }

            if !recorder.status.isEmpty {
                Text(recorder.status)
                    .font(.caption)
                    .foregroundStyle(recorder.status.contains("Hata") ? .red : .secondary)
                    .lineLimit(3)
            }

            Spacer(minLength: 0)
        }
        .padding(22)
        .frame(maxWidth: 400)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(nsColor: .controlBackgroundColor))
                .shadow(color: .black.opacity(0.08), radius: 24, y: 10)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
        )
    }

    private var windowSubtitle: String {
        if let t = recorder.captureTargetWindowTitle, !t.isEmpty {
            return t
        }
        return "Listeden seç…"
    }

    private func sourceRow(
        icon: String,
        title: String,
        subtitle: String?,
        selected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title3)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    if let subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.blue)
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(selected ? Color.blue.opacity(0.1) : Color.primary.opacity(0.04))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        selected ? Color.blue.opacity(0.35) : Color.primary.opacity(0.08),
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

private struct RecordingTimerStrip: View {
    @EnvironmentObject private var recorder: ScreenRecorder

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { context in
            if let start = recorder.recordingStartedAt, recorder.isRecording {
                Text(formatElapsed(from: start, to: context.date))
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.white)
            } else {
                Text("0:00")
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
            }
        }
    }

    private func formatElapsed(from start: Date, to now: Date) -> String {
        let s = max(0, Int(now.timeIntervalSince(start)))
        let m = s / 60
        let r = s % 60
        return String(format: "%d:%02d", m, r)
    }
}
