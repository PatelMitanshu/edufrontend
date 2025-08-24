const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration optimized for production builds
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    minifierConfig: {
      keep_fnames: false,
      mangle: {
        keep_fnames: false,
      },
      compress: {
        drop_console: false, // Keep console for debugging release issues temporarily
      },
    },
  },
  resolver: {
    // Ignore unnecessary files to reduce bundle size
    blockList: [
      /.*\/__tests__\/.*/,
      /.*\.test\.(ts|tsx|js|jsx)$/,
      /.*\.spec\.(ts|tsx|js|jsx)$/,
      /.*\.stories\.(ts|tsx|js|jsx)$/,
    ],
    // Ensure all required file extensions are resolved
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
