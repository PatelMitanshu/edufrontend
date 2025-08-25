/**
 * @format
 */

/**
 * @format
 */

// Mock heavy native/navigation modules so Jest can run without transforming node_modules
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
      Screen: ({ component: Component, ...props }: any) => React.createElement(Component as any, props),
    }),
  };
});

jest.mock('@react-navigation/drawer', () => {
  const React = require('react');
  return {
    createDrawerNavigator: () => ({
      Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
      Screen: ({ component: Component, ...props }: any) => React.createElement(Component as any, props),
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => {
    const React = require('react');
    return React.createElement('SafeAreaView', props, props.children);
  }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock document picker and image picker native modules
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(() => Promise.resolve([])),
  types: { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel' }
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({})),
  launchCamera: jest.fn(() => Promise.resolve({})),
}));

jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-webview', () => 'WebView');
jest.mock('react-native-vector-icons', () => ({
  Icon: 'Icon'
}));

// Specific mock for deep import used across the app
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return function MaterialIcons(props: any) {
    return React.createElement('MaterialIcons', props, props.children);
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(React.createElement(App));
  });
});
