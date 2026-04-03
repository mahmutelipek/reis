import AppKit
import SwiftUI

/// Hesap, gelişmiş ve durum — Loom’daki dişli menüsüne denk.
struct DesktopSettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var recorder: ScreenRecorder
    @EnvironmentObject private var desktop: DesktopSettings

    @Binding var uploadLog: String

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if PromptlyConfig.looksLikePlaceholder {
                        Label {
                            Text(
                                "Sunucu adresi eksik: PromptlyConfig, `.promptly-api-base` veya PROMPTLY_API_BASE."
                            )
                            .font(.subheadline)
                            .foregroundStyle(.orange)
                        } icon: {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                        }
                    } else {
                        Label {
                            Text("Kayıtlar web kütüphanende.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        } icon: {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
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
                            .lineLimit(4)
                    }

                    HStack {
                        if desktop.sessionToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Label("API anahtarı", systemImage: "key.fill")
                                .foregroundStyle(.secondary)
                        } else {
                            Label("Bağlı", systemImage: "checkmark.seal.fill")
                                .foregroundStyle(.green)
                        }
                        Spacer()
                        Button("Tarayıcıda tekrar giriş…") {
                            if let url = desktop.browserConnectURL {
                                NSWorkspace.shared.open(url)
                            }
                        }
                    }

                    Button("Çıkış") {
                        desktop.clearSession()
                        desktop.legacyDesktopKey = ""
                        dismiss()
                    }
                    .foregroundStyle(.red)
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
            .navigationTitle("Ayarlar")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Tamam") { dismiss() }
                }
            }
        }
        .frame(minWidth: 480, minHeight: 420)
    }
}
