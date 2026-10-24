// ADR 0027 checks V3 and V4, the Mac half: Core Audio reads a recording the way the app does.
//
// `probe` and `decode` mirror apps/mobile/modules/scribe-audio/ios/ScribeAudioModule.swift (`probe`,
// `decodePcm16`, `decodePiece`) line for line, on macOS's AVFoundation instead of iOS's: AVAudioFile opened with a
// Float32 processing format at the file's rate, `file.length` for the duration, and an AVAudioConverter to 16 kHz
// mono PCM16 with every short read left as zeros. It also counts what the ADR's proposed native check would see: a
// read that returns 0 frames while more than one AAC frame of Core Audio's own length is still unread.
// `asset` and `seek` are V4's player half: AVURLAsset's duration as expo-audio builds it (no precise-timing key) and
// with the key, and where an AVPlayer seek lands with infinite tolerance (expo-audio 57's seekTo) and with none.
//
// macOS only, and the same framework is not the same device: every number here is [U] for iOS until the in-app
// half runs (README.md section 8). Reads only; `decode` writes the 16 kHz PCM to the path it is given,
// which the caller deletes. Prints one JSON object; never a path, never audio.
//
//   swift experiments/adts-coreaudio.swift probe  <file>
//   swift experiments/adts-coreaudio.swift decode <file> <startMs> <endMs> <out.pcm>
//   swift experiments/adts-coreaudio.swift asset  <file>
//   swift experiments/adts-coreaudio.swift seek   <file> <seconds> [<seconds> ...]
import AVFoundation
import Foundation

let whisperRate: Double = 16_000
let maxDecodeSamples = 20 * 60 * 16_000

func emit(_ object: [String: Any]) {
  let data = try! JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
  print(String(data: data, encoding: .utf8)!)
}

func fail(_ code: String) -> Never {
  emit(["ok": false, "code": code])
  exit(0)
}

func openForReading(_ path: String) -> AVAudioFile {
  let url = URL(fileURLWithPath: path)
  guard FileManager.default.fileExists(atPath: url.path) else { fail("ERR_SCRIBE_AUDIO_FILE_MISSING") }
  do {
    return try AVAudioFile(forReading: url, commonFormat: .pcmFormatFloat32, interleaved: false)
  } catch {
    fail("ERR_SCRIBE_AUDIO_DECODE")
  }
}

/// ScribeAudioModule.samples: the same rounding as msToSamples in transcribe-plan.ts.
func samples(_ ms: Double) -> Int {
  let value = (ms * whisperRate / 1000).rounded()
  guard value.isFinite, value > 0 else { return 0 }
  return value >= Double(maxDecodeSamples) ? maxDecodeSamples : Int(value)
}

/// ScribeAudioModule.frame.
func frame(_ ms: Double, rate: Double, limit: AVAudioFramePosition) -> AVAudioFramePosition {
  let value = (ms / 1000 * rate).rounded()
  guard value.isFinite, value > 0, limit > 0 else { return 0 }
  return value >= Double(limit) ? limit : AVAudioFramePosition(value)
}

func probe(_ path: String) {
  let file = openForReading(path)
  let rate = file.fileFormat.sampleRate
  emit([
    "ok": true,
    "durationMs": rate > 0 ? Double(file.length) / rate * 1000 : 0,
    "sampleRate": rate,
    "channels": Int(file.fileFormat.channelCount),
    "lengthFrames": Int(file.length),
  ])
}

/// ScribeAudioModule.decode with one piece and no silence before it (the shape of a VAD window in
/// transcribe-run.ts findSpeech), then decodePiece as it is, counting the reads.
func decode(_ path: String, startMs: Double, endMs: Double, outPath: String) {
  let file = openForReading(path)
  guard let outFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: whisperRate, channels: 1, interleaved: true) else {
    fail("ERR_SCRIBE_AUDIO_DECODE")
  }
  let capacity = samples(endMs - startMs)
  var out = [Int16](repeating: 0, count: max(1, capacity)) // short reads stay zero, as in ScribeAudio
  let inFormat = file.processingFormat
  let rate = inFormat.sampleRate
  guard rate.isFinite, rate > 0 else { fail("ERR_SCRIBE_AUDIO_DECODE") }
  let start = frame(startMs, rate: rate, limit: file.length)
  let end = frame(endMs, rate: rate, limit: file.length)
  var written = 0
  var readFrames: AVAudioFramePosition = 0
  var earlyStops = 0 // reads that returned 0 frames with more than one AAC frame of Core Audio's length unread
  var unreadAtStop: AVAudioFramePosition = 0
  if end > start, capacity > 0 {
    file.framePosition = start
    guard let converter = AVAudioConverter(from: inFormat, to: outFormat),
          let outBuffer = AVAudioPCMBuffer(pcmFormat: outFormat, frameCapacity: AVAudioFrameCount(whisperRate)) else {
      fail("ERR_SCRIBE_AUDIO_DECODE")
    }
    converter.downmix = true
    let block = AVAudioFrameCount(max(1024, Int(min(rate, 192_000))))
    var remaining = AVAudioFrameCount(min(end - start, AVAudioFramePosition(UInt32.max)))
    var readError: Error?
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
          if remaining > 1024 {
            earlyStops += 1
            unreadAtStop = AVAudioFramePosition(remaining)
          }
          remaining = 0
          outStatus.pointee = .endOfStream
          return nil
        }
        readFrames += AVAudioFramePosition(input.frameLength)
        remaining -= min(remaining, input.frameLength)
        outStatus.pointee = .haveData
        return input
      }
      if readError != nil || status == .error { fail("ERR_SCRIBE_AUDIO_DECODE") }
      let n = min(Int(outBuffer.frameLength), capacity - written)
      if n > 0, let channel = outBuffer.int16ChannelData?[0] {
        for i in 0..<n { out[written + i] = channel[i] }
        written += n
      }
      if status == .endOfStream { break }
      if status == .inputRanDry && outBuffer.frameLength == 0 { break }
    }
  }
  let bytes = out.prefix(capacity).withUnsafeBufferPointer { Data(buffer: $0) }
  FileManager.default.createFile(atPath: outPath, contents: bytes)
  emit([
    "ok": true,
    "samples": capacity,
    "decodedSamples": written,
    "readFrames": Int(readFrames),
    "lengthFrames": Int(file.length),
    "earlyStops": earlyStops,
    "unreadFramesAtStop": Int(unreadAtStop),
  ])
}

/// V4: the duration AVFoundation gives the player, as expo-audio 57 builds the asset (no
/// AVURLAssetPreferPreciseDurationAndTimingKey, AudioUtils.swift:87-93) and with the key.
func asset(_ path: String) async throws {
  let url = URL(fileURLWithPath: path)
  let plain = AVURLAsset(url: url)
  let precise = AVURLAsset(url: url, options: [AVURLAssetPreferPreciseDurationAndTimingKey: true])
  let a = try await plain.load(.duration)
  let b = try await precise.load(.duration)
  let playable = try await plain.load(.isPlayable)
  emit(["ok": true, "playable": playable, "durationS": a.seconds, "preciseDurationS": b.seconds])
}

/// V4: where a seek lands, with infinite tolerance (expo-audio 57's seekTo) and with none, without and with the key.
func seek(_ path: String, targets: [Double]) async {
  var results: [[String: Any]] = []
  for precise in [false, true] {
    let url = URL(fileURLWithPath: path)
    let asset = precise ? AVURLAsset(url: url, options: [AVURLAssetPreferPreciseDurationAndTimingKey: true]) : AVURLAsset(url: url)
    let item = AVPlayerItem(asset: asset)
    let player = AVPlayer(playerItem: item)
    player.volume = 0
    let deadline = Date().addingTimeInterval(10)
    while item.status == .unknown && Date() < deadline { RunLoop.current.run(until: Date().addingTimeInterval(0.05)) }
    guard item.status == .readyToPlay else { fail("not_ready") }
    for t in targets {
      for exact in [false, true] {
        let target = CMTime(seconds: t, preferredTimescale: 48_000)
        let tolerance = exact ? CMTime.zero : CMTime.positiveInfinity
        _ = await player.seek(to: target, toleranceBefore: tolerance, toleranceAfter: tolerance)
        results.append(["preciseKey": precise, "zeroTolerance": exact, "targetS": t, "landedS": player.currentTime().seconds])
      }
    }
  }
  emit(["ok": true, "seeks": results])
}

let args = CommandLine.arguments
guard args.count >= 3 else {
  FileHandle.standardError.write("usage: probe|decode|asset|seek <file> ...\n".data(using: .utf8)!)
  exit(2)
}
switch args[1] {
case "probe":
  probe(args[2])
case "decode":
  guard args.count == 6, let startMs = Double(args[3]), let endMs = Double(args[4]) else { exit(2) }
  decode(args[2], startMs: startMs, endMs: endMs, outPath: args[5])
case "asset":
  do { try await asset(args[2]) } catch { fail("not_loaded") }
case "seek":
  let targets = args.dropFirst(3).compactMap(Double.init)
  guard !targets.isEmpty else { exit(2) }
  await seek(args[2], targets: targets)
default:
  exit(2)
}
