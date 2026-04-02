import SwiftUI

/// İleride: `SFSpeechRecognizer` + script highlight + `NSWindow` (SCContentFilter hariç).
struct PrompterPlaceholderView: View {
    @State private var script: String = "Kayıt öncesi script burada düzenlenecek…"

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Teleprompter (yer tutucu)")
                .font(.headline)
            TextEditor(text: $script)
                .font(.system(.body, design: .monospaced))
                .scrollContentBackground(.hidden)
                .padding(8)
                .background(Color(nsColor: .textBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}
