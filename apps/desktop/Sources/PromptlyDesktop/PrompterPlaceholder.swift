import SwiftUI

/// İleride: `SFSpeechRecognizer` + script highlight + `NSWindow` (SCContentFilter hariç).
struct PrompterPlaceholderView: View {
    @State private var script: String = "Kayıt öncesi script burada düzenlenecek…"

    var body: some View {
        Form {
            Section {
                TextEditor(text: $script)
                    .font(.system(.body, design: .monospaced))
                    .frame(minHeight: 200)
                    .scrollContentBackground(.hidden)
            } header: {
                Text("Metin")
            } footer: {
                Text("Kayıt öncesi script; ileride senkron prompter burada olacak.")
                    .font(.caption)
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}
