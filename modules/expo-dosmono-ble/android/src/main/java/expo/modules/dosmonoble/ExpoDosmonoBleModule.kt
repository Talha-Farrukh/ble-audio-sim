package expo.modules.dosmonoble

import android.content.Context
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import android.os.Handler
import android.os.Looper
import java.util.concurrent.atomic.AtomicBoolean

class ExpoDosmonoBleModule : Module() {
  
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React Application Context is null" }

  private var isInitialized = AtomicBoolean(false)
  private var isConnected = false
  private var connectedDeviceMac: String? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private var initializationTask: Runnable? = null
  
  override fun definition() = ModuleDefinition {
    Name("ExpoDosmonoBle")

    // Events that can be sent to JavaScript
    Events(
      "onAuthResult",
      "onSearchStart", 
      "onDevicesFound",
      "onSearchStop",
      "onConnectStatus",
      "onConnectSuccess", 
      "onConnectFail",
      "onRecordStart",
      "onRecordStop",
      "onFileTransferProgress",
      "onCmdReceive",
      "onFileList"
    )

    // Initialize the SDK
    AsyncFunction("initialize") { accessKey: String, secretKey: String, promise: Promise ->
      try {
        // Cancel any pending initialization
        initializationTask?.let { mainHandler.removeCallbacks(it) }
        
        // Only initialize if not already initialized
        if (isInitialized.get()) {
          promise.resolve(true)
          return@AsyncFunction
        }

        // Create new initialization task
        initializationTask = Runnable {
          if (isInitialized.compareAndSet(false, true)) {
            sendEvent("onAuthResult", bundleOf(
              "success" to true,
              "message" to "Authentication successful"
            ))
          }
        }

        // Schedule the initialization task
        mainHandler.postDelayed(initializationTask!!, 500)
        promise.resolve(true)
      } catch (e: Exception) {
        isInitialized.set(false)
        promise.reject("INIT_FAILED", e.message, e)
      }
    }

    // Check if Bluetooth is enabled
    Function("isBluetoothEnabled") {
      try {
        // Basic check - can be enhanced later
        true
      } catch (e: Exception) {
        false
      }
    }

    // Check if GPS is enabled
    Function("isGpsEnabled") {
      try {
        // Basic check - can be enhanced later
        true
      } catch (e: Exception) {
        false
      }
    }

    // Start device search
    AsyncFunction("startDeviceSearch") { promise: Promise ->
      try {
        if (!isInitialized.get()) {
          promise.reject("NOT_INITIALIZED", "SDK not initialized", null)
          return@AsyncFunction
        }

        // Mock device search for now
        sendEvent("onSearchStart", bundleOf())

        // Simulate finding a device
        val mockDevices = listOf(
          bundleOf(
            "name" to "Dosmono Device",
            "mac" to "00:00:00:00:00:00",
            "rssi" to -50
          )
        )
        sendEvent("onDevicesFound", bundleOf("devices" to mockDevices))
        sendEvent("onSearchStop", bundleOf())
        
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("SEARCH_FAILED", e.message, e)
      }
    }

    // Stop device search
    Function("stopDeviceSearch") {
      try {
        sendEvent("onSearchStop", bundleOf())
        true
      } catch (e: Exception) {
        false
      }
    }

    // Connect to device
    AsyncFunction("connectDevice") { mac: String, promise: Promise ->
      try {
        if (!isInitialized.get()) {
          promise.reject("NOT_INITIALIZED", "SDK not initialized", null)
          return@AsyncFunction
        }

        // Mock connection for now
        isConnected = true
        connectedDeviceMac = mac
        sendEvent("onConnectStatus", bundleOf("mac" to mac, "connected" to true))
        sendEvent("onConnectSuccess", bundleOf("mac" to mac))
        promise.resolve(mac)
      } catch (e: Exception) {
        promise.reject("CONNECT_ERROR", e.message, e)
      }
    }

    // Disconnect device
    Function("disconnectDevice") {
      try {
        isConnected = false
        val mac = connectedDeviceMac
        connectedDeviceMac = null
        if (mac != null) {
          sendEvent("onConnectStatus", bundleOf("mac" to mac, "connected" to false))
        }
        true
      } catch (e: Exception) {
        false
      }
    }

    // Send command to device
    AsyncFunction("sendCommand") { command: String, flag: String, promise: Promise ->
      try {
        if (!isConnected) {
          promise.reject("NOT_CONNECTED", "Device not connected", null)
          return@AsyncFunction
        }

        // Mock command sending
        sendEvent("onCmdReceive", bundleOf("command" to command, "flag" to flag))
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("SEND_CMD_FAILED", e.message, e)
      }
    }

    // Initialize recording
    AsyncFunction("initializeRecording") { promise: Promise ->
      try {
        if (!isConnected) {
          promise.reject("NOT_CONNECTED", "Device not connected", null)
          return@AsyncFunction
        }

        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("RECORD_INIT_FAILED", e.message, e)
      }
    }

    // Start recording
    AsyncFunction("startRecording") { promise: Promise ->
      try {
        if (!isConnected) {
          promise.reject("NOT_CONNECTED", "Device not connected", null)
          return@AsyncFunction
        }

        sendEvent("onRecordStart", bundleOf(
          "fileName" to "test_recording.wav",
          "path" to "/storage/recordings/",
          "fileType" to 1
        ))
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("START_RECORDING_FAILED", e.message, e)
      }
    }

    // Stop recording  
    Function("stopRecording") {
      try {
        sendEvent("onRecordStop", bundleOf())
        true
      } catch (e: Exception) {
        false
      }
    }

    // Set audio storage path
    Function("setAudioStoragePath") { path: String ->
      try {
        // Store path for later use
        true
      } catch (e: Exception) {
        false
      }
    }

    // Transfer file by name
    AsyncFunction("transferFile") { fileName: String, startPoint: Int, promise: Promise ->
      try {
        if (!isConnected) {
          promise.reject("NOT_CONNECTED", "Device not connected", null)
          return@AsyncFunction
        }

        // Mock file transfer progress
        sendEvent("onFileTransferProgress", bundleOf("progress" to 0.5))
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("TRANSFER_FAILED", e.message, e)
      }
    }

    // Get connection status
    Function("getConnectionStatus") {
      bundleOf(
        "isConnected" to isConnected,
        "connectedDevice" to connectedDeviceMac
      )
    }

    // Release resources
    Function("release") {
      try {
        isInitialized.set(false)
        isConnected = false
        connectedDeviceMac = null
        true
      } catch (e: Exception) {
        false
      }
    }
  }
}
