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
            path: "Sources/PromptlyDesktop"
        ),
    ]
)
