package expo.modules.scribestore

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.time.Instant

/**
 * Android stub (Google Play is v1.1, brief decision 9). Same surface as the iOS
 * module so JavaScript has one code path: no store view, no entitlements, and
 * every action answers "unavailable". Nothing is gated harder because of it:
 * Free stays Free and existing books stay open.
 */
class ScribeStoreModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScribeStore")

    Events("onEntitlementsChanged")

    Function("storeViewSupport") {
      "unsupported"
    }

    Function("startTransactionListener") {
      Unit
    }

    AsyncFunction("currentEntitlements") { _: List<String> ->
      mapOf(
        "entitlements" to emptyList<Map<String, Any>>(),
        "statuses" to emptyList<Map<String, Any>>(),
        "checkedAt" to Instant.now().toString()
      )
    }

    AsyncFunction("presentSubscriptionStore") { _: Map<String, Any?> ->
      mapOf("outcome" to "unavailable")
    }

    AsyncFunction("showManageSubscriptions") {
      "unavailable"
    }

    AsyncFunction("sync") {
      "failed"
    }

    AsyncFunction("beginRefundRequest") { _: List<String> ->
      "unavailable"
    }
  }
}
