import ScreenCaptureKit
import SwiftUI

/// Tek pencere kaydı için paylaşılabilir pencere listesi (macOS 14+ filtre mantığı `ScreenRecorder` ile uyumlu).
struct DesktopWindowPickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var recorder: ScreenRecorder

    private struct Row: Identifiable {
        let id: CGWindowID
        let title: String
    }

    @State private var rows: [Row] = []
    @State private var loadError: String?
    @State private var loading = true

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView("Pencereler yükleniyor…")
                } else if let loadError {
                    Text(loadError)
                        .foregroundStyle(.secondary)
                        .padding()
                } else if rows.isEmpty {
                    Text("Uygun pencere yok.")
                        .foregroundStyle(.secondary)
                        .padding()
                } else {
                    List(rows) { w in
                        Button {
                            recorder.captureTargetWindowID = w.id
                            recorder.captureTargetWindowTitle = w.title
                            dismiss()
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(w.title)
                                    .foregroundStyle(.primary)
                                Text("ID \(w.id)")
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            }
            .frame(minWidth: 420, minHeight: 340)
            .navigationTitle("Pencere seç")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("İptal") { dismiss() }
                }
            }
        }
        .task { await loadWindows() }
    }

    private func loadWindows() async {
        do {
            let c = try await SCShareableContent.excludingDesktopWindows(
                false,
                onScreenWindowsOnly: true
            )
            let myPid = ProcessInfo.processInfo.processIdentifier
            let picked = c.windows
                .filter { $0.isOnScreen && ($0.owningApplication?.processID ?? 0) != myPid }
                .filter { $0.frame.width > 48 && $0.frame.height > 48 }
            let sortedWin = picked.sorted { (a: SCWindow, b: SCWindow) in
                let ta = a.title ?? ""
                let tb = b.title ?? ""
                return ta.localizedCaseInsensitiveCompare(tb) == .orderedAscending
            }
            let list: [Row] = sortedWin.map { w in
                let t = w.title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                return Row(
                    id: w.windowID,
                    title: t.isEmpty ? "Adsız pencere" : t
                )
            }

            await MainActor.run {
                rows = list
                loading = false
            }
        } catch {
            await MainActor.run {
                loadError = error.localizedDescription
                loading = false
            }
        }
    }
}
