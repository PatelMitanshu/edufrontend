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
        drop_console: true, // Remove console.log statements in production
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
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
