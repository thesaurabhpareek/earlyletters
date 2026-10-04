import AVFoundation
import AudioToolbox
import CryptoKit
import ExpoModulesCore

/// One range of the recording to decode, with digital silence before it (TDD 03 3.5.3).
struct DecodePiece: Record {
  @Field var srcStartMs: Double = 0
  @Field var srcEndMs: Double = 0
  @Field var silenceBeforeMs: Double = 0
}

struct EnhanceOptions: Record {
  /// Share of the isolated voice, 0 to 100.
  @Field var mix: Double = 80
}

/// Errors carry a stable code and a fixed message: never a path, never content (LEGAL-REQ-014).
final class ScribeAudioException: Exception, @unchecked Sendable {
  private let codeValue: String
  private let message: String

  init(_ code: String, _ message: String) {
    self.codeValue = code
    self.message = message
    super.init()
  }

  override var code: String { codeValue }
  override var reason: String { message }
}

/// ADR 0015, TDD 03 3.4. Everything here reads the original recording and
/// never writes to it. Decoded 16 kHz audio lives in memory only
/// (LEGAL-REQ-018): it is returned as an ArrayBuffer that wraps native
/// memory and is freed when JavaScript drops it.
public class ScribeAudioModule: Module {
  private static let whisperRate: Double = 16_000
  private static let isolationDescription = AudioComponentDescription(
    componentType: kAudioUnitType_Effect,
    componentSubType: kAudioUnitSubType_AUSoundIsolation,
    componentManufacturer: kAudioUnitManufacturer_Apple,
    componentFlags: 0,
    componentFlagsMask: 0
  )

  private let cancelLock = NSLock()
  private var cancelled = Set<String>()

  public func definition() -> ModuleDefinition {
    Name("ScribeAudio")

    Events("onEnhanceProgress")

    AsyncFunction("probe") { (uri: String) throws -> [String: Any] in
      let file = try Self.openForReading(uri)
      let rate = file.fileFormat.sampleRate
      return [
        "durationMs": rate > 0 ? Double(file.length) / rate * 1000 : 0,
        "sampleRate": rate,
        "channels": Int(file.fileFormat.channelCount),
      ]
    }

    AsyncFunction("decodePcm16") { (uri: String, pieces: [DecodePiece]) throws -> NativeArrayBuffer in
      try Self.decode(uri: uri, pieces: pieces)
    }

    AsyncFunction("sha256File") { (uri: String) throws -> String in
      try Self.sha256(of: Self.fileURL(uri))
    }

    Function("isIsolationAvailable") { () -> Bool in
      Self.isolationAvailable()
    }

    Function("listeningDirectory") { () throws -> String in
      let fm = FileManager.default
      let support = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      var dir = support.appendingPathComponent("listening", isDirectory: true)
      try fm.createDirectory(at: dir, withIntermediateDirectories: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true // a copy we can always make again from the original
      try dir.setResourceValues(values)
      return dir.absoluteString
    }

    AsyncFunction("enhance") { (jobId: String, inUri: String, outUri: String, options: EnhanceOptions) throws -> [String: Any] in
      defer { self.clearCancel(jobId) }
      return try self.enhance(jobId: jobId, inURL: Self.fileURL(inUri), outURL: Self.fileURL(outUri), mix: options.mix)
    }

    Function("cancelEnhance") { (jobId: String) in
      self.cancelLock.lock()
      self.cancelled.insert(jobId)
      self.cancelLock.unlock()
    }
  }

  // MARK: - Files

  private static func fileURL(_ uri: String) throws -> URL {
    let url = uri.hasPrefix("file:") ? URL(string: uri) : URL(fileURLWithPath: uri)
    guard let url, url.isFileURL else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_FILE_MISSING", "Not a local file URI")
    }
    return url
  }

  private static func openForReading(_ uri: String) throws -> AVAudioFile {
    let url = try fileURL(uri)
    guard FileManager.default.fileExists(atPath: url.path) else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_FILE_MISSING", "Recording file not found")
    }
    do {
      // Processing format: 32-bit float, deinterleaved, at the file's own rate.
      return try AVAudioFile(forReading: url, commonFormat: .pcmFormatFloat32, interleaved: false)
    } catch {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_DECODE", "Recording could not be opened")
    }
  }

  private static func sha256(of url: URL) throws -> String {
    guard let handle = try? FileHandle(forReadingFrom: url) else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_FILE_MISSING", "File not found")
    }
    defer { try? handle.close() }
    var hasher = SHA256()
    while true {
      let chunk: Data = try autoreleasepool {
        (try handle.read(upToCount: 1 << 20)) ?? Data()
      }
      if chunk.isEmpty { break }
      hasher.update(data: chunk)
    }
    return hasher.finalize().map { String(format: "%02x", $0) }.joined()
  }

  // MARK: - Decode (AAC M4A to 16 kHz mono PCM16 LE, memory only)

  /// Same rounding as `msToSamples` in src/lib/transcribe-plan.ts, so the
  /// buffer length always equals `chunkSampleCount` on the JavaScript side.
  private static func samples(_ ms: Double) -> Int {
    max(0, Int((ms * whisperRate / 1000).rounded()))
  }

  private static func decode(uri: String, pieces: [DecodePiece]) throws -> NativeArrayBuffer {
    let file = try openForReading(uri)
    guard let outFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: whisperRate, channels: 1, interleaved: true) else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_DECODE", "Output format unavailable")
    }
    let counts = pieces.map { (silence: samples($0.silenceBeforeMs), speech: samples(max(0, $0.srcEndMs - $0.srcStartMs))) }
    let total = counts.reduce(0) { $0 + $1.silence + $1.speech }
    let capacity = max(1, total)
    let pointer = UnsafeMutablePointer<Int16>.allocate(capacity: capacity)
    pointer.initialize(repeating: 0, count: capacity) // inserted silence and any short read stay zero
    var cursor = 0
    do {
      for (index, piece) in pieces.enumerated() {
        cursor += counts[index].silence
        try decodePiece(file: file, startMs: piece.srcStartMs, endMs: piece.srcEndMs, into: pointer + cursor, capacity: counts[index].speech, outFormat: outFormat)
        cursor += counts[index].speech
      }
    } catch {
      pointer.deinitialize(count: capacity)
      pointer.deallocate()
      throw error
    }
    let raw = UnsafeMutableRawBufferPointer(start: UnsafeMutableRawPointer(pointer), count: total * MemoryLayout<Int16>.size)
    return try NativeArrayBuffer.wrap(dataWithoutCopy: raw) {
      pointer.deinitialize(count: capacity)
      pointer.deallocate()
    }
  }

  /// Decodes [startMs, endMs) of the file into `dest`, at most `capacity`
  /// samples. A fresh converter per piece, so filter state never leaks
  /// across a cut.
  private static func decodePiece(file: AVAudioFile, startMs: Double, endMs: Double, into dest: UnsafeMutablePointer<Int16>, capacity: Int, outFormat: AVAudioFormat) throws {
    guard capacity > 0 else { return }
    let inFormat = file.processingFormat
    let rate = inFormat.sampleRate
    let start = max(0, AVAudioFramePosition((startMs / 1000 * rate).rounded()))
    let end = min(file.length, AVAudioFramePosition((endMs / 1000 * rate).rounded()))
    guard end > start else { return }
    file.framePosition = start

    guard let converter = AVAudioConverter(from: inFormat, to: outFormat),
          let outBuffer = AVAudioPCMBuffer(pcmFormat: outFormat, frameCapacity: AVAudioFrameCount(whisperRate)) else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_DECODE", "Converter unavailable")
    }
    converter.downmix = true // a stereo file becomes mono; our recordings are already mono

    let block = AVAudioFrameCount(max(1024, Int(rate))) // about 1 s of input per read
    var remaining = AVAudioFrameCount(end - start)
    var readError: Error?
    var written = 0

    while written < capacity {
      var convertError: NSError?
      outBuffer.frameLength = 0
      let status = converter.convert(to: outBuffer, error: &convertError) { _, outStatus in
        if remaining == 0 {
          outStatus.pointee = .endOfStream
          return nil
        }
        guard let input = AVAudioPCMBuffer(pcmFormat: inFormat, frameCapacity: min(block, remaining)) else {
          outStatus.pointee = .endOfStream
          return nil
        }
        do {
          try file.read(into: input, frameCount: min(block, remaining))
        } catch {
          readError = error
          outStatus.pointee = .endOfStream
          return nil
        }
        if input.frameLength == 0 {
          remaining = 0
          outStatus.pointee = .endOfStream
          return nil
        }
        remaining -= min(remaining, input.frameLength)
        outStatus.pointee = .haveData
        return input
      }
      if readError != nil || status == .error {
        throw ScribeAudioException("ERR_SCRIBE_AUDIO_DECODE", "Recording could not be decoded")
      }
      let n = min(Int(outBuffer.frameLength), capacity - written)
      if n > 0, let channel = outBuffer.int16ChannelData?[0] {
        (dest + written).update(from: channel, count: n)
        written += n
      }
      if status == .endOfStream { break }
      if status == .inputRanDry && outBuffer.frameLength == 0 { break }
    }
  }

  // MARK: - Listening copy (system voice isolation)

  private static func isolationAvailable() -> Bool {
    !AVAudioUnitComponentManager.shared().components(matching: isolationDescription).isEmpty
  }

  private func isCancelled(_ jobId: String) -> Bool {
    cancelLock.lock()
    defer { cancelLock.unlock() }
    return cancelled.contains(jobId)
  }

  private func clearCancel(_ jobId: String) {
    cancelLock.lock()
    cancelled.remove(jobId)
    cancelLock.unlock()
  }

  /// Renders the original through AUSoundIsolation offline and writes an
  /// AAC M4A copy. Writes to `<out>.part` and moves it into place only when
  /// complete, so a cancel or failure leaves no file behind.
  private func enhance(jobId: String, inURL: URL, outURL: URL, mix: Double) throws -> [String: Any] {
    guard Self.isolationAvailable() else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_ISOLATION_UNAVAILABLE", "Voice isolation is not available on this device")
    }
    guard FileManager.default.fileExists(atPath: inURL.path) else {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_FILE_MISSING", "Recording file not found")
    }
    let source: AVAudioFile
    do {
      source = try AVAudioFile(forReading: inURL)
    } catch {
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_DECODE", "Recording could not be opened")
    }
    let format = source.processingFormat
    let part = outURL.appendingPathExtension("part")
    let fm = FileManager.default
    try? fm.removeItem(at: part)

    let engine = AVAudioEngine()
    let player = AVAudioPlayerNode()
    let isolation = AVAudioUnitEffect(audioComponentDescription: Self.isolationDescription)
    engine.attach(player)
    engine.attach(isolation)
    engine.connect(player, to: isolation, format: format)
    engine.connect(isolation, to: engine.mainMixerNode, format: format)

    var output: AVAudioFile?
    defer {
      player.stop()
      engine.stop()
    }
    do {
      try engine.enableManualRenderingMode(.offline, format: format, maximumFrameCount: 4096)
      let unit = isolation.audioUnit
      AudioUnitSetParameter(unit, AudioUnitParameterID(kAUSoundIsolationParam_WetDryMixPercent), kAudioUnitScope_Global, 0, AudioUnitParameterValue(max(0, min(100, mix))), 0)
      if #available(iOS 18.0, *) {
        AudioUnitSetParameter(unit, AudioUnitParameterID(kAUSoundIsolationParam_SoundToIsolate), kAudioUnitScope_Global, 0, AudioUnitParameterValue(kAUSoundIsolationSoundType_HighQualityVoice), 0)
      }
      try engine.start()
      player.scheduleFile(source, at: nil)
      player.play()

      let settings: [String: Any] = [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVSampleRateKey: format.sampleRate,
        AVNumberOfChannelsKey: format.channelCount,
        AVEncoderBitRateKey: 64_000,
      ]
      output = try AVAudioFile(forWriting: part, settings: settings, commonFormat: .pcmFormatFloat32, interleaved: false)
      guard let buffer = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: engine.manualRenderingMaximumFrameCount) else {
        throw ScribeAudioException("ERR_SCRIBE_AUDIO_ENHANCE", "Render buffer unavailable")
      }

      // The isolation unit delays its output; render that much extra at the
      // end and drop it at the start, so the copy lines up with the original.
      let latency = AVAudioFramePosition((isolation.latency * format.sampleRate).rounded())
      var skip = max(0, latency)
      let target = source.length + max(0, latency)
      var lastReported = -1
      var stalls = 0

      while engine.manualRenderingSampleTime < target {
        if isCancelled(jobId) {
          throw ScribeAudioException("ERR_SCRIBE_AUDIO_CANCELLED", "Cancelled")
        }
        let frames = AVAudioFrameCount(min(AVAudioFramePosition(buffer.frameCapacity), target - engine.manualRenderingSampleTime))
        let status = try engine.renderOffline(frames, to: buffer)
        switch status {
        case .success:
          stalls = 0
          var length = Int(buffer.frameLength)
          if skip > 0, length > 0 {
            let drop = min(Int(skip), length)
            skip -= AVAudioFramePosition(drop)
            let keep = length - drop
            if keep > 0, let channels = buffer.floatChannelData {
              for c in 0..<Int(buffer.format.channelCount) {
                memmove(channels[c], channels[c] + drop, keep * MemoryLayout<Float>.size)
              }
            }
            buffer.frameLength = AVAudioFrameCount(keep)
            length = keep
          }
          if length > 0 { try output?.write(from: buffer) }
        case .insufficientDataFromInputNode, .cannotDoInCurrentContext:
          stalls += 1
          if stalls > 100 { throw ScribeAudioException("ERR_SCRIBE_AUDIO_ENHANCE", "Render stalled") }
        case .error:
          throw ScribeAudioException("ERR_SCRIBE_AUDIO_ENHANCE", "Render failed")
        @unknown default:
          throw ScribeAudioException("ERR_SCRIBE_AUDIO_ENHANCE", "Render failed")
        }
        let percent = Int(Double(engine.manualRenderingSampleTime) / Double(max(1, target)) * 100)
        if percent != lastReported && percent % 2 == 0 {
          lastReported = percent
          sendEvent("onEnhanceProgress", ["jobId": jobId, "progress": Double(percent) / 100])
        }
      }

      if #available(iOS 18.0, *) { output?.close() }
      output = nil // closing the writer finalizes the M4A
      if fm.fileExists(atPath: outURL.path) {
        _ = try fm.replaceItemAt(outURL, withItemAt: part)
      } else {
        try fm.moveItem(at: part, to: outURL)
      }
      var finished = outURL
      var values = URLResourceValues()
      values.isExcludedFromBackup = true // made again from the original whenever needed
      try? finished.setResourceValues(values)
      sendEvent("onEnhanceProgress", ["jobId": jobId, "progress": 1.0])
      return ["durationMs": format.sampleRate > 0 ? Double(source.length) / format.sampleRate * 1000 : 0]
    } catch {
      output = nil
      try? fm.removeItem(at: part)
      if let known = error as? ScribeAudioException { throw known }
      throw ScribeAudioException("ERR_SCRIBE_AUDIO_ENHANCE", "Listening copy could not be made")
    }
  }
}
