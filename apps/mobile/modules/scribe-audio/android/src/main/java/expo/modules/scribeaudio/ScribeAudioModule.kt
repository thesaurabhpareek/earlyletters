package expo.modules.scribeaudio

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android stub (Android ships in v1.1, founder decision 9). Every call that
 * would touch audio fails with ERR_SCRIBE_AUDIO_UNSUPPORTED, so the app keeps
 * the recording and its words wait, exactly as when a speech pack is missing.
 * The real implementation will use MediaExtractor + MediaCodec for decode.
 */
class ScribeAudioUnsupportedException :
  CodedException("ERR_SCRIBE_AUDIO_UNSUPPORTED", "scribe-audio is not available on Android yet", null)

private fun <T> unsupported(): T = throw ScribeAudioUnsupportedException()

class ScribeAudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScribeAudio")

    Events("onEnhanceProgress")

    AsyncFunction("probe") { _: String ->
      unsupported<Map<String, Any>>()
    }

    AsyncFunction("decodePcm16") { _: String, _: List<Map<String, Double>> ->
      unsupported<ByteArray>()
    }

    AsyncFunction("sha256File") { _: String ->
      unsupported<String>()
    }

    Function("isIsolationAvailable") {
      false
    }

    // Empty string: no listening directory on this platform (callers check isIsolationAvailable first).
    Function("listeningDirectory") {
      ""
    }

    AsyncFunction("enhance") { _: String, _: String, _: String, _: Map<String, Double> ->
      unsupported<Map<String, Any>>()
    }

    Function("cancelEnhance") { _: String ->
      Unit
    }
  }
}
