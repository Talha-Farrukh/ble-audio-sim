const { withAndroidManifest, withMainApplication, withGradleProperties, withSettingsGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Plugin to integrate Dosmono SDK
const withDosmonoSDK = (config) => {
  // Add Android manifest modifications
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add permissions
    const permissions = [
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.ACCESS_NETWORK_STATE', 
      'android.permission.READ_PHONE_STATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.RECORD_AUDIO',
      'android.permission.MOUNT_UNMOUNT_FILESYSTEMS'
    ];

    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission'].find(p => p.$['android:name'] === permission)) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Add Bluetooth features
    if (!androidManifest.manifest['uses-feature']) {
      androidManifest.manifest['uses-feature'] = [];
    }
    
    const features = [
      { 'android:name': 'android.hardware.bluetooth_le', 'android:required': 'false' },
      { 'android:name': 'android.hardware.bluetooth', 'android:required': 'false' }
    ];

    features.forEach(feature => {
      if (!androidManifest.manifest['uses-feature'].find(f => f.$['android:name'] === feature['android:name'])) {
        androidManifest.manifest['uses-feature'].push({ $: feature });
      }
    });

    // Add service and provider to application
    const application = androidManifest.manifest.application[0];
    
    // Add BLE service
    if (!application.service) application.service = [];
    if (!application.service.find(s => s.$['android:name'] === 'com.dosmono.recorder.service.BleService')) {
      application.service.push({
        $: {
          'android:name': 'com.dosmono.recorder.service.BleService',
          'android:enabled': 'true',
          'android:exported': 'false'
        },
        'intent-filter': [{
          $: { 'android:priority': '1000' },
          action: [{ $: { 'android:name': 'com.dosmono.BleService' } }]
        }]
      });
    }

    // Add FileProvider
    if (!application.provider) application.provider = [];
    if (!application.provider.find(p => p.$['android:authorities'] === '${applicationId}.fileProvider')) {
      application.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': '${applicationId}.fileProvider',
          'android:exported': 'false',
          'android:grantUriPermissions': 'true'
        },
        'meta-data': [{
          $: {
            'android:name': 'android.support.FILE_PROVIDER_PATHS',
            'android:resource': '@xml/file_paths'
          }
        }]
      });
    }

    return config;
  });

  // Add MainApplication modifications
  config = withMainApplication(config, (config) => {
    const { modResults } = config;
    let mainApplicationContent = modResults.contents;

    // Add Dosmono SDK package import and registration
    if (!mainApplicationContent.includes('DosmonoSDKPackage')) {
      // Add import
      const importToAdd = 'import com.dsavagezr.bleaudiosim.DosmonoSDKPackage';
      const packageImportRegex = /(import.*ReactPackage\s*;?\s*)/;
      if (packageImportRegex.test(mainApplicationContent)) {
        mainApplicationContent = mainApplicationContent.replace(
          packageImportRegex,
          `$1\n${importToAdd}\n`
        );
      }

      // Add package to getPackages method
      const packagesMethodRegex = /(packages\.add\(.*?\)\s*;?\s*return packages)/s;
      if (packagesMethodRegex.test(mainApplicationContent)) {
        mainApplicationContent = mainApplicationContent.replace(
          packagesMethodRegex,
          `packages.add(DosmonoSDKPackage())\n            $1`
        );
      }
    }

    modResults.contents = mainApplicationContent;
    return config;
  });

  return config;
};

// Hook to copy files after prebuild
const withDosmonoFiles = (config) => {
  return config;
};

module.exports = function withDosmonoSDKPlugin(config) {
  config = withDosmonoSDK(config);
  config = withDosmonoFiles(config);
  return config;
}; 