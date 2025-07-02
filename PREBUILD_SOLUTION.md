# 🛡️ Expo Prebuild Solution for Dosmono SDK

## ⚠️ **THE PROBLEM**

When you run `npx expo prebuild`, Expo will **COMPLETELY REGENERATE** the `android/` and `ios/` directories, which means:

- ✅ **ALL YOUR CUSTOM NATIVE FILES WILL BE DELETED**
- ✅ **ALL BUILD.GRADLE MODIFICATIONS WILL BE LOST**
- ✅ **ALL ANDROIDMANIFEST.XML CHANGES WILL BE ERASED**
- ✅ **THE AAR FILE WILL BE REMOVED**

## 🎯 **THE SOLUTION**

I've created a comprehensive solution that preserves all your Dosmono SDK integration:

### 1. **Expo Plugin** (`expo-plugins/dosmono-sdk-plugin/index.js`)
- Automatically configures `AndroidManifest.xml` with all permissions and services
- Modifies `MainApplication.kt` to register the Dosmono SDK package
- Updates `build.gradle` with all dependencies and configurations
- Runs **EVERY TIME** you prebuild

### 2. **Native File Templates** (`native-templates/`)
- Backup copies of your custom Kotlin files
- Will be copied back after prebuild runs
- Preserves your React Native bridge code

### 3. **Post-Prebuild Script** (`scripts/post-prebuild-dosmono.js`)
- Automatically copies native files back after prebuild
- Restores the AAR file
- Creates necessary directories

### 4. **Updated Configuration** (`app.config.js`)
- Uses the plugin system
- Configures all Android permissions
- Sets up build properties

## 🚀 **HOW TO USE**

### **Option 1: Safe Prebuild (Recommended)**
```bash
npm run prebuild-safe
```
This runs prebuild + automatically restores your native files.

### **Option 2: Clean Prebuild**
```bash
npm run prebuild-clean
```
This does a clean prebuild + restores native files.

### **Option 3: Manual Steps**
If you prefer manual control:

1. **Run prebuild:**
   ```bash
   npx expo prebuild
   ```

2. **Restore native files:**
   ```bash
   node scripts/post-prebuild-dosmono.js
   ```

## 📋 **REQUIRED MANUAL STEPS**

You still need to do these steps **ONCE**:

### 1. **Copy the AAR File**
```bash
cp SDK/SDKTest/app/libs/sdk.aar android/app/libs/
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Update Native Module** (Optional)
When you're ready to use the real SDK, uncomment the imports in:
- `native-templates/DosmonoModule.kt`

## 🔄 **WORKFLOW**

### **Current State:**
- ✅ Plugin handles ALL configuration automatically
- ✅ Native files are preserved via templates
- ✅ Post-prebuild script restores everything
- ✅ Safe to run prebuild anytime

### **What Happens When You Run Prebuild:**
1. Expo regenerates `android/` directory
2. Plugin automatically applies all configurations
3. Post-prebuild script copies back native files
4. **Everything works exactly as before!**

## 📁 **FILE STRUCTURE**

```
ble-audio-sim/
├── expo-plugins/
│   └── dosmono-sdk-plugin/
│       └── index.js                 # Expo plugin for configuration
├── native-templates/
│   ├── DosmonoModule.kt             # Backup of your native module
│   ├── DosmonoSDKPackage.kt         # Backup of your package
│   └── file_paths.xml               # Backup of FileProvider config
├── scripts/
│   └── post-prebuild-dosmono.js     # File restoration script
├── app.config.js                    # Expo configuration with plugin
└── package.json                     # Updated with new scripts
```

## ⚡ **BENEFITS**

1. **🛡️ SAFE PREBUILDS:** Never lose your native code again
2. **🔄 AUTOMATIC:** Plugin handles all configurations
3. **🎯 PRECISE:** Exactly preserves your integration
4. **🚀 FAST:** No manual file copying needed
5. **🔧 MAINTAINABLE:** Easy to update and modify

## 🆘 **TROUBLESHOOTING**

### **If Native Files Are Missing:**
```bash
node scripts/post-prebuild-dosmono.js
```

### **If Build Fails:**
1. Ensure AAR file is in `android/app/libs/`
2. Check that plugin is registered in `app.config.js`
3. Run clean prebuild: `npm run prebuild-clean`

### **If Permissions Are Missing:**
The plugin automatically handles all permissions. If you need to add more:
1. Edit `expo-plugins/dosmono-sdk-plugin/index.js`
2. Add to the `permissions` array
3. Run prebuild again

## 🎉 **CONCLUSION**

Your Dosmono SDK integration is now **PREBUILD-SAFE**! 

You can run `npm run prebuild-safe` or `npm run prebuild-clean` anytime without fear of losing your custom native code. The plugin system ensures all configurations are applied automatically, and the post-prebuild script restores your native files.

**Happy coding! 🚀** 