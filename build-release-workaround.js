const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Release APK with CMake workaround...');

// Function to execute commands
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`\n📋 Running: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Step 1: Clean previous builds
console.log('\n🧹 Cleaning previous builds...');
const androidDir = path.join(__dirname, 'android');
runCommand('gradlew clean', androidDir);

// Step 2: Generate debug build first to create required CMake files
console.log('\n🔧 Building debug first to generate CMake files...');
const debugSuccess = runCommand('gradlew assembleDebug', androidDir);

if (!debugSuccess) {
  console.error('❌ Debug build failed. Cannot proceed with release build.');
  process.exit(1);
}

// Step 3: Copy generated files from debug to release if needed
console.log('\n📁 Preparing release build environment...');

// Step 4: Create bundle with Metro for release
console.log('\n📦 Creating release bundle...');
const bundleCommand = 'npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/';
runCommand(bundleCommand);

// Step 5: Build release APK without native compilation first
console.log('\n🏗️ Building release APK...');
const releaseSuccess = runCommand('gradlew bundleRelease', androidDir);

if (releaseSuccess) {
  console.log('\n✅ Release bundle created successfully!');
  
  // Try to build APK
  const apkSuccess = runCommand('gradlew assembleRelease', androidDir);
  
  if (apkSuccess) {
    console.log('\n🎉 Release APK built successfully!');
    console.log('📱 APK location: android/app/build/outputs/apk/release/app-release.apk');
  } else {
    console.log('\n⚠️  APK build failed, but bundle was created successfully.');
    console.log('💡 You can use the bundle for other distribution methods.');
  }
} else {
  console.error('❌ Release build failed.');
  process.exit(1);
}

console.log('\n🏁 Build process completed!');
