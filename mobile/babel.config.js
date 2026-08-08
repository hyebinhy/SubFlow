module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin은 Reanimated 4에서 필수이며 반드시 plugins 배열의 마지막에 와야 한다.
    plugins: ['react-native-worklets/plugin'],
  };
};
