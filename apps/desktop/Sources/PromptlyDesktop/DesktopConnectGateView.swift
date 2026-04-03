import AppKit
import SwiftUI

/// PopAir tarzı: tek ekran, tarayıcıda Clerk → `promptly://` ile dönüş.
struct DesktopConnectGateView: View {
    @EnvironmentObject private var desktop: DesktopSettings

    var body: some View {
        ZStack {
            Color(red: 0.07, green: 0.07, blue: 0.09)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 48)

                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.32, green: 0.52, blue: 1.0),
                                    Color(red: 0.58, green: 0.36, blue: 0.98),
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)
                        .shadow(color: .black.opacity(0.35), radius: 10, y: 4)

                    Text("P")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                }

                Text("Promptly")
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.top, 14)

                Text("Oturum açın")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.top, 28)

                Text("Lütfen giriş yapın veya kayıt olun")
                    .font(.subheadline)
                    .foregroundStyle(Color(white: 0.52))
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
                    .padding(.horizontal, 32)

                Spacer(minLength: 36)

                if PromptlyConfig.looksLikePlaceholder {
                    Text(
                        "Sunucu adresi eksik: PromptlyConfig.swift, `.promptly-api-base` veya PROMPTLY_API_BASE."
                    )
                    .font(.caption)
                    .foregroundStyle(.orange.opacity(0.95))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
                } else {
                    Button(action: openBrowserConnect) {
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(.white)
                                    .frame(width: 32, height: 32)
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Color(red: 0.2, green: 0.45, blue: 1.0))
                            }
                            Text("Giriş yap veya üye ol")
                                .font(.body.weight(.semibold))
                        }
                        .frame(maxWidth: 320)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.22, green: 0.48, blue: 0.98))
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .shadow(color: .black.opacity(0.25), radius: 12, y: 6)
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut("l", modifiers: [.command])

                    Button("Panodan yapıştır") {
                        if let s = NSPasteboard.general.string(forType: .string)?
                            .trimmingCharacters(in: .whitespacesAndNewlines),
                           !s.isEmpty {
                            desktop.sessionToken = s
                        }
                    }
                    .buttonStyle(.link)
                    .font(.caption)
                    .foregroundStyle(Color(white: 0.42))
                    .padding(.top, 20)
                }

                Spacer(minLength: 56)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(minWidth: 520, minHeight: 480)
    }

    private func openBrowserConnect() {
        guard let url = desktop.browserConnectURL else { return }
        NSWorkspace.shared.open(url)
    }
}
