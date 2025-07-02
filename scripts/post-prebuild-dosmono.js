#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Source files to copy (backup your native files here)
const sourceFiles = [
  {
    source: 'native-templates/DosmonoModule.kt',
    dest: 'android/app/src/main/java/com/dsavagezr/bleaudiosim/DosmonoModule.kt'
  },
  {
    source: 'native-templates/DosmonoSDKPackage.kt', 
    dest: 'android/app/src/main/java/com/dsavagezr/bleaudiosim/DosmonoSDKPackage.kt'
  },
  {
    source: 'native-templates/file_paths.xml',
    dest: 'android/app/src/main/res/xml/file_paths.xml'
  },
  {
    source: 'SDK/SDKTest/app/libs/sdk.aar',
    dest: 'android/app/libs/sdk.aar'
  }
];

console.log('🔧 Post-prebuild: Copying Dosmono SDK native files...');

// Ensure directories exist
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy files
sourceFiles.forEach(({ source, dest }) => {
  try {
    if (fs.existsSync(source)) {
      ensureDirectoryExists(dest);
      fs.copyFileSync(source, dest);
      console.log(`✅ Copied: ${source} → ${dest}`);
    } else {
      console.log(`⚠️  Source not found: ${source}`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${source}:`, error.message);
  }
});

console.log('🚀 Dosmono SDK native files copy completed!');

module.exports = {}; 