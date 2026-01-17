module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'babel-plugin-react-compiler',
      // NOTE: reanimated plugin MUST be listed last
      'react-native-reanimated/plugin'
    ],
  };
};