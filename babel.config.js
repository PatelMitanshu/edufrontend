module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    // Remove console.log statements in production
    ['transform-remove-console', { exclude: ['error', 'warn'] }],
  ],
  env: {
    production: {
      plugins: [
        'react-native-reanimated/plugin',
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
      ],
    },
  },
};
