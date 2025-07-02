const { 
  withAndroidManifest, 
  withMainApplication, 
  withAppBuildGradle,
  withPlugins 
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Main plugin function
function withDosmonoSDK(config, props = {}) {
  
  // 1. Configure Android Manifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add Dosmono SDK permissions
    const permissions = [
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.RECORD_AUDIO',
      { name: 'android.permission.MOUNT_UNMOUNT_FILESYSTEMS', maxSdkVersion: '28' }
    ];

    // Ensure uses-permission array exists
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    permissions.forEach(permission => {
      const permName = typeof permission === 'string' ? permission : permission.name;
      const existing = androidManifest.manifest['uses-permission'].find(p => p.$['android:name'] === permName);
      
      if (!existing) {
        const permObj = { $: { 'android:name': permName } };
        if (permission.maxSdkVersion) {
          permObj.$['android:maxSdkVersion'] = permission.maxSdkVersion;
        }
        androidManifest.manifest['uses-permission'].push(permObj);
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
      const existing = androidManifest.manifest['uses-feature'].find(f => f.$['android:name'] === feature['android:name']);
      if (!existing) {
        androidManifest.manifest['uses-feature'].push({ $: feature });
      }
    });

    // Configure application section
    const application = androidManifest.manifest.application[0];
    
    // Add BLE service
    if (!application.service) application.service = [];
    const existingService = application.service.find(s => s.$['android:name'] === 'com.dosmono.recorder.service.BleService');
    if (!existingService) {
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
    const existingProvider = application.provider.find(p => 
      p.$['android:authorities'] && p.$['android:authorities'].includes('fileProvider')
    );
    if (!existingProvider) {
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

  // 2. Configure MainApplication
  config = withMainApplication(config, (config) => {
    const { modResults } = config;
    let mainApplicationContent = modResults.contents;

    // Add import for DosmonoSDKPackage
    const dosmonoImport = 'import com.dsavagezr.bleaudiosim.DosmonoSDKPackage';
    if (!mainApplicationContent.includes('DosmonoSDKPackage')) {
      // Find a good place to add the import
      const packageImportRegex = /(import com\.facebook\.react\.ReactPackage)/;
      if (packageImportRegex.test(mainApplicationContent)) {
        mainApplicationContent = mainApplicationContent.replace(
          packageImportRegex,
          `$1\n${dosmonoImport}`
        );
      } else {
        // Fallback: add after other imports
        const lastImportRegex = /(import.*?;\s*\n)(?=\n|class)/;
        mainApplicationContent = mainApplicationContent.replace(
          lastImportRegex,
          `$1${dosmonoImport};\n\n`
        );
      }

      // Add package to getPackages method
      const getPackagesRegex = /(override fun getPackages\(\): List<ReactPackage> \{[\s\S]*?)(return packages)/;
      if (getPackagesRegex.test(mainApplicationContent)) {
        mainApplicationContent = mainApplicationContent.replace(
          getPackagesRegex,
          (match, beforeReturn, returnStatement) => {
            if (!beforeReturn.includes('DosmonoSDKPackage')) {
              return beforeReturn + 'packages.add(DosmonoSDKPackage())\n            ' + returnStatement;
            }
            return match;
          }
        );
      }
    }

    modResults.contents = mainApplicationContent;
    return config;
  });

  // 3. Configure app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    let buildGradleContent = modResults.contents;

    // Add Kotlin kapt plugin if not present
    if (!buildGradleContent.includes('kotlin-kapt')) {
      buildGradleContent = buildGradleContent.replace(
        /(apply plugin: "org\.jetbrains\.kotlin\.android")/,
        '$1\napply plugin: "org.jetbrains.kotlin.kapt"'
      );
    }

    // Add multiDex and NDK config to defaultConfig
    const defaultConfigRegex = /(defaultConfig\s*\{[\s\S]*?)(versionName.*?\n)/;
    if (defaultConfigRegex.test(buildGradleContent)) {
      buildGradleContent = buildGradleContent.replace(
        defaultConfigRegex,
        (match, beforeVersion, versionLine) => {
          let config = beforeVersion + versionLine;
          if (!config.includes('multiDexEnabled')) {
            config += '\n        multiDexEnabled true\n';
          }
          if (!config.includes('ndk {')) {
            config += `        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }\n`;
          }
          return config;
        }
      );
    }

    // Add packaging options
    const packagingOptionsConfig = `
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/io.netty.versions.properties'
        exclude 'META-INF/INDEX.LIST'
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE.txt'
        exclude 'project.properties'
        exclude 'META-INF/speech_release.kotlin_module'
        exclude 'META-INF/translate_release.kotlin_module'
    }`;

    if (!buildGradleContent.includes('exclude \'META-INF/LICENSE\'')) {
      // Find existing packagingOptions or add new one
      if (buildGradleContent.includes('packagingOptions {')) {
        // Replace existing packagingOptions
        const packagingRegex = /(packagingOptions\s*\{[\s\S]*?\})/;
        buildGradleContent = buildGradleContent.replace(packagingRegex, packagingOptionsConfig);
      } else {
        // Add new packagingOptions after signingConfigs
        const androidBlockRegex = /(android\s*\{[\s\S]*?)(}\s*$)/m;
        buildGradleContent = buildGradleContent.replace(
          androidBlockRegex,
          (match, androidContent, closingBrace) => {
            return androidContent + '\n' + packagingOptionsConfig + '\n' + closingBrace;
          }
        );
      }
    }

    // Add repositories section for flatDir
    const repoConfig = `
repositories {
    flatDir {
        dirs 'libs'
    }
}`;

    if (!buildGradleContent.includes('flatDir')) {
      // Add repositories section before dependencies
      const dependenciesRegex = /(dependencies\s*\{)/;
      buildGradleContent = buildGradleContent.replace(
        dependenciesRegex,
        repoConfig + '\n\n$1'
      );
    }

    // Add dependencies
    const dosmonoDependencies = `
    // Dosmono SDK AAR file
    implementation(name: 'sdk', ext: 'aar')
    
    // Dosmono SDK dependencies
    implementation 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.10'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.multidex:multidex:2.0.1'
    implementation 'androidx.recyclerview:recyclerview:1.3.0'
    implementation 'androidx.core:core:1.10.1'
    
    // Dagger for dependency injection
    implementation 'com.google.dagger:dagger:2.45'
    kapt 'com.google.dagger:dagger-compiler:2.45'
    
    // Networking libraries
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.retrofit2:adapter-rxjava2:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    implementation 'io.reactivex.rxjava2:rxandroid:2.1.1'
    
    // Additional SDK dependencies
    implementation 'com.alibaba:fastjson:1.2.83'
    implementation 'top.zibin:Luban:1.1.8'
    implementation 'org.jetbrains.anko:anko:0.10.8'
    implementation 'com.github.tbruyelle:rxpermissions:0.10.2'
    implementation 'org.java-websocket:Java-WebSocket:1.5.3'
    implementation 'com.jeremyliao:live-event-bus-x:1.8.0'
`;

    if (!buildGradleContent.includes('Dosmono SDK dependencies')) {
      // Add dependencies after react-android
      const reactAndroidRegex = /(implementation\(\"com\.facebook\.react:react-android\"\))/;
      buildGradleContent = buildGradleContent.replace(
        reactAndroidRegex,
        '$1\n' + dosmonoDependencies
      );
    }

    modResults.contents = buildGradleContent;
    return config;
  });

  return config;
}

// Plugin to copy native files after prebuild
function withDosmonoNativeFiles(config) {
  return config;
}

module.exports = withDosmonoSDK; 