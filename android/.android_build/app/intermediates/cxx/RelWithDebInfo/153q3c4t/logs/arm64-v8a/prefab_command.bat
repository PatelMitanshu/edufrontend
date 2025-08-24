@echo off
"C:\\Program Files\\Microsoft\\jdk-17.0.15.6-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\mitan\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  arm64-v8a ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\mitan\\AppData\\Local\\Temp\\agp-prefab-staging385813234418721316\\staged-cli-output" ^
  "C:\\Users\\mitan\\.gradle\\caches\\8.14.1\\transforms\\60eef7dfacf480bffc823686b1403bef\\transformed\\react-android-0.80.1-release\\prefab" ^
  "C:\\react_native\\educationapp\\appfrontend\\android\\.android_build\\app\\intermediates\\cxx\\refs\\react-native-reanimated\\1gc5e733" ^
  "C:\\Users\\mitan\\.gradle\\caches\\8.14.1\\transforms\\9671b38726d372d2dc19b265895266a4\\transformed\\hermes-android-0.80.1-release\\prefab" ^
  "C:\\Users\\mitan\\.gradle\\caches\\8.14.1\\transforms\\b6a6ccfe82730aba80016e7d9940f54a\\transformed\\fbjni-0.7.0\\prefab"
