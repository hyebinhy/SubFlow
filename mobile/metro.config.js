const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SVG 지원 설정을 ESM 호환 가능한 방식으로 유지하되 최소화
try {
  const { transformer, resolver } = config;
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };
} catch (e) {
  console.warn('SVG transformer configuration failed, using default config.');
}

module.exports = config;
