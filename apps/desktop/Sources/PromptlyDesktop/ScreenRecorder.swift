import AppKit
import AVFoundation
import Combine
import CoreMedia
import ScreenCaptureKit

/// Ekran + sistem sesi kaydı. Bu süreçteki tüm pencereler (ana + prompter) `SCContentFilter` ile hariç tutulur —
/// izleyici kayıtta Promptly arayüzünü görmez (masaüstü / diğer uygulamalar görünür).
final class ScreenRecorder: NSObject, ObservableObject {
    @Published private(set) var isRecording = false
    @Published private(set) var status: String = ""
    @Published private(set) var lastRecordingURL: URL?
    /// Kayıt başladığında doldurulur (sol şerit süresi için).
    @Published private(set) var recordingStartedAt: Date?
    /// `nil` = tüm ekran; dolu = tek pencere (macOS 14+).
    @Published var captureTargetWindowID: CGWindowID?
    @Published var captureTargetWindowTitle: String?
    /// Sistem / uygulama sesi (ScreenCaptureKit).
    @Published var captureSystemAudio: Bool = true

    private var stream: SCStream?
    private var writer: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var audioInput: AVAssetWriterInput?
    private let queue = DispatchQueue(label: "reiso.promptly.screencapture")
    private var sessionStarted = false
    private var pendingAudio: [CMSampleBuffer] = []

    func startRecording() {
        guard !isRecording else { return }
        status = "İzin ve hazırlık…"
        sessionStarted = false
        pendingAudio.removeAll()
        writer = nil
        videoInput = nil
        audioInput = nil

        Task {
            await beginCapture()
        }
    }

    /// Son kayıt dosyasını sil (Loom’daki çöp).
    func discardLastRecording() {
        guard let url = lastRecordingURL else { return }
        try? FileManager.default.removeItem(at: url)
        lastRecordingURL = nil
        status = "Kayıt silindi."
    }

    private func beginCapture() async {
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(
                false,
                onScreenWindowsOnly: true
            )
            let pid = ProcessInfo.processInfo.processIdentifier
            let filter: SCContentFilter

            if let wid = captureTargetWindowID {
                guard let win = content.windows.first(where: { $0.windowID == wid && $0.isOnScreen }) else {
                    await setStatus(
                        "Seçilen pencere yok. Yeniden seç veya «Tüm ekran» kullan."
                    )
                    return
                }
                if #available(macOS 14.0, *) {
                    filter = SCContentFilter(desktopIndependentWindow: win)
                } else {
                    await setStatus("Pencere kaydı için macOS 14 veya üzeri gerekli.")
                    return
                }
            } else {
                guard let display = content.displays.first else {
                    await setStatus("Ekran bulunamadı.")
                    return
                }

                let exclude = content.applications.filter { $0.processID == pid }
                if exclude.isEmpty {
                    filter = SCContentFilter(display: display, excludingWindows: [])
                    await setStatus("Uyarı: bu süreç pencereleri hariç tutulamadı (devam ediliyor).")
                } else {
                    filter = SCContentFilter(
                        display: display,
                        excludingApplications: exclude,
                        exceptingWindows: []
                    )
                }
            }

            let cfg = SCStreamConfiguration()
            cfg.showsCursor = true
            cfg.capturesAudio = captureSystemAudio
            // Tam 4K/5K kayıt dosyayı şişirir → yükleme çok uzar. 1920 kenar üstü ölçekle.
            let (capW, capH): (Int, Int) = {
                if let wid = captureTargetWindowID,
                   let win = content.windows.first(where: { $0.windowID == wid }) {
                    let f = win.frame
                    let dw = Int(f.width.rounded())
                    let dh = Int(f.height.rounded())
                    let maxEdge = 1920
                    if dw > maxEdge || dh > maxEdge {
                        let s = min(Double(maxEdge) / Double(dw), Double(maxEdge) / Double(dh))
                        let w = max(640, (Int(Double(dw) * s) / 2) * 2)
                        let h = max(360, (Int(Double(dh) * s) / 2) * 2)
                        return (w, h)
                    }
                    return (max(640, dw - dw % 2), max(360, dh - dh % 2))
                }
                guard let display = content.displays.first else { return (1280, 720) }
                let dw = display.width
                let dh = display.height
                let maxEdge = 1920
                var capW = dw
                var capH = dh
                if dw > maxEdge || dh > maxEdge {
                    let s = min(Double(maxEdge) / Double(dw), Double(maxEdge) / Double(dh))
                    capW = max(640, (Int(Double(dw) * s) / 2) * 2)
                    capH = max(360, (Int(Double(dh) * s) / 2) * 2)
                }
                return (capW, capH)
            }()
            cfg.width = capW
            cfg.height = capH
            cfg.minimumFrameInterval = CMTime(value: 1, timescale: 60)

            let newStream = SCStream(filter: filter, configuration: cfg, delegate: self)
            try newStream.addStreamOutput(self, type: .screen, sampleHandlerQueue: queue)
            if cfg.capturesAudio {
                try newStream.addStreamOutput(self, type: .audio, sampleHandlerQueue: queue)
            }

            try await newStream.startCapture()
            self.stream = newStream
            await MainActor.run {
                self.isRecording = true
                self.recordingStartedAt = Date()
                self.status = "Kayıt yapılıyor…"
            }
        } catch {
            await MainActor.run {
                self.status = "Hata: \(error.localizedDescription)"
                self.isRecording = false
                self.recordingStartedAt = nil
            }
        }
    }

    func stopRecording() {
        guard isRecording else { return }
        Task {
            do {
                if let stream {
                    try await stream.stopCapture()
                }
                stream = nil
                videoInput?.markAsFinished()
                audioInput?.markAsFinished()
                let finalURL = lastRecordingURL
                if let writer {
                    await finishWriter(writer)
                }
                await MainActor.run {
                    self.isRecording = false
                    self.recordingStartedAt = nil
                    if let u = finalURL {
                        self.status = "Kayıt: \(u.path)"
                    } else {
                        self.status = "Kayıt durdu."
                    }
                }
            } catch {
                await MainActor.run {
                    self.isRecording = false
                    self.recordingStartedAt = nil
                    self.status = "Durdurma hatası: \(error.localizedDescription)"
                }
            }
        }
    }

    @MainActor
    private func setStatus(_ s: String) {
        status = s
    }

    private func finishWriter(_ w: AVAssetWriter) async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            w.finishWriting {
                cont.resume()
            }
        }
        writer = nil
        videoInput = nil
        audioInput = nil
    }

    private func setupWriter(videoBuffer: CMSampleBuffer) throws {
        guard writer == nil else { return }
        guard let format = CMSampleBufferGetFormatDescription(videoBuffer) else { return }

        let dims = CMVideoFormatDescriptionGetDimensions(format)
        let f = ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-")
        let movies = FileManager.default.urls(for: .moviesDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        let url = movies.appendingPathComponent("Promptly-\(f).mp4")
        try? FileManager.default.removeItem(at: url)

        let w = try AVAssetWriter(outputURL: url, fileType: .mp4)
        // ~4.5 Mbps hedef: ekran kaydı için yeterli, dosya boyutu ve upload süresi belirgin düşer.
        let bitrate = 4_500_000
        let vInput = AVAssetWriterInput(
            mediaType: .video,
            outputSettings: [
                AVVideoCodecKey: AVVideoCodecType.h264,
                AVVideoWidthKey: dims.width,
                AVVideoHeightKey: dims.height,
                AVVideoCompressionPropertiesKey: [
                    AVVideoAverageBitRateKey: bitrate,
                    AVVideoMaxKeyFrameIntervalKey: 60,
                    AVVideoProfileLevelKey: AVVideoProfileLevelH264BaselineAutoLevel,
                ] as [String: Any],
            ],
            sourceFormatHint: format
        )
        vInput.expectsMediaDataInRealTime = true
        guard w.canAdd(vInput) else { throw NSError(domain: "Promptly", code: 1) }
        w.add(vInput)

        videoInput = vInput
        writer = w

        w.startWriting()
        let t = CMSampleBufferGetPresentationTimeStamp(videoBuffer)
        w.startSession(atSourceTime: t)
        sessionStarted = true

        DispatchQueue.main.async { [weak self] in
            self?.lastRecordingURL = url
        }

        if !pendingAudio.isEmpty, let aIn = audioInput {
            for b in pendingAudio {
                if aIn.isReadyForMoreMediaData { aIn.append(b) }
            }
            pendingAudio.removeAll()
        }
    }

    private func setupAudioIfNeeded(from buffer: CMSampleBuffer) throws {
        guard audioInput == nil, let w = writer, let format = CMSampleBufferGetFormatDescription(buffer) else {
            return
        }
        let aIn = AVAssetWriterInput(
            mediaType: .audio,
            outputSettings: nil,
            sourceFormatHint: format
        )
        aIn.expectsMediaDataInRealTime = true
        guard w.canAdd(aIn) else { return }
        w.add(aIn)
        audioInput = aIn
    }

    private func handle(sampleBuffer: CMSampleBuffer, type: SCStreamOutputType) {
        guard CMSampleBufferDataIsReady(sampleBuffer) else { return }

        switch type {
        case .screen:
            do {
                try setupWriter(videoBuffer: sampleBuffer)
                if let vIn = videoInput, vIn.isReadyForMoreMediaData {
                    vIn.append(sampleBuffer)
                }
            } catch {
                DispatchQueue.main.async { [weak self] in
                    self?.status = "Yazıcı: \(error.localizedDescription)"
                }
            }
        case .audio:
            if writer == nil || !sessionStarted {
                pendingAudio.append(sampleBuffer)
                return
            }
            do {
                try setupAudioIfNeeded(from: sampleBuffer)
                if let aIn = audioInput, aIn.isReadyForMoreMediaData {
                    aIn.append(sampleBuffer)
                }
            } catch {
                break
            }
        default:
            break
        }
    }
}

extension ScreenRecorder: SCStreamDelegate {
    func stream(_ stream: SCStream, didStopWithError error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.isRecording = false
            self?.recordingStartedAt = nil
            self?.status = "Akış durdu: \(error.localizedDescription)"
        }
    }
}

extension ScreenRecorder: SCStreamOutput {
    func stream(
        _ stream: SCStream,
        didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        of type: SCStreamOutputType
    ) {
        handle(sampleBuffer: sampleBuffer, type: type)
    }
}
