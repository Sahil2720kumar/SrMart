module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['babel-plugin-react-compiler', {
        target: '19' // or '19' depending on your React version
      }],
      // NOTE: reanimated plugin MUST be listed last
      'react-native-reanimated/plugin'
    ],
  };
};