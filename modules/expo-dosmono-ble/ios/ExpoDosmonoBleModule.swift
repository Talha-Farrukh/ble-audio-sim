import ExpoModulesCore
import CoreBluetooth

public class ExpoDosmonoBleModule: Module {
  private var isInitialized = false
  private var isConnected = false
  private var connectedDeviceMac: String? = nil
  
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoDosmonoBle')` in JavaScript.
    Name("ExpoDosmonoBle")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Define all events that can be sent to JavaScript
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
    AsyncFunction("initialize") { (accessKey: String, secretKey: String, promise: Promise) in
      do {
        // For testing, simulate successful initialization
        self.isInitialized = true
        self.sendEvent("onAuthResult", [
          "success": true,
          "message": "Authentication successful"
        ])
        promise.resolve(true)
      } catch {
        promise.reject(error)
      }
    }

    // Check if Bluetooth is enabled
    Function("isBluetoothEnabled") { () -> Bool in
      return CBCentralManager().state == .poweredOn
    }

    // Check if GPS is enabled (always true on iOS as it's handled by system permissions)
    Function("isGpsEnabled") { () -> Bool in
      return true
    }

    // Start device search
    AsyncFunction("startDeviceSearch") { (promise: Promise) in
      if !self.isInitialized {
        promise.reject(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "SDK not initialized"]))
        return
      }

      // Simulate device discovery
      self.sendEvent("onSearchStart", [:])
      
      // Mock device data
      let mockDevices = [
        [
          "name": "Test Device",
          "mac": "00:11:22:33:44:55",
          "rssi": -60
        ]
      ]
      
      self.sendEvent("onDevicesFound", ["devices": mockDevices])
      self.sendEvent("onSearchStop", [:])
      
      promise.resolve(true)
    }

    // Other required functions with basic implementations
    Function("stopDeviceSearch") { () -> Bool in
      self.sendEvent("onSearchStop", [:])
      return true
    }

    AsyncFunction("connectDevice") { (mac: String, promise: Promise) in
      if !self.isInitialized {
        promise.reject(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "SDK not initialized"]))
        return
      }

      self.isConnected = true
      self.connectedDeviceMac = mac
      self.sendEvent("onConnectStatus", ["mac": mac, "connected": true])
      self.sendEvent("onConnectSuccess", ["mac": mac])
      promise.resolve(mac)
    }

    Function("disconnectDevice") { () -> Bool in
      self.isConnected = false
      if let mac = self.connectedDeviceMac {
        self.sendEvent("onConnectStatus", ["mac": mac, "connected": false])
      }
      self.connectedDeviceMac = nil
      return true
    }

    AsyncFunction("sendCommand") { (command: String, flag: String, promise: Promise) in
      if !self.isConnected {
        promise.reject(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Device not connected"]))
        return
      }
      
      self.sendEvent("onCmdReceive", ["command": command, "flag": flag])
      promise.resolve(true)
    }

    AsyncFunction("initializeRecording") { (promise: Promise) in
      promise.resolve(true)
    }

    AsyncFunction("startRecording") { (promise: Promise) in
      if !self.isConnected {
        promise.reject(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Device not connected"]))
        return
      }
      
      self.sendEvent("onRecordStart", [
        "fileName": "test_recording.wav",
        "path": "/recordings/",
        "fileType": 1
      ])
      promise.resolve(true)
    }

    Function("stopRecording") { () -> Bool in
      self.sendEvent("onRecordStop", [:])
      return true
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(ExpoDosmonoBleView.self) {
      // Defines a setter for the `url` prop.
      Prop("url") { (view: ExpoDosmonoBleView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }

      Events("onLoad")
    }
  }
}
