// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PromptlyDesktop",
    platforms: [
        .macOS(.v13),
    ],
    products: [
        .executable(name: "PromptlyDesktop", targets: ["PromptlyDesktop"]),
    ],
    targets: [
        .executableTarget(
            name: "PromptlyDesktop",
            path: "Sources/PromptlyDesktop",
            linkerSettings: [
                // `swift run` çıktısına `promptly://` kaydı (LS tarafından tanınır).
                .unsafeFlags([
                    "-Xlinker", "-sectcreate", "-Xlinker", "__TEXT", "-Xlinker", "__info_plist", "-Xlinker",
                    "EmbeddedInfo.plist",
                ]),
            ]
        ),
    ]
)
