// Uniwind must wrap the config last (docs.uniwind.dev/quickstart).
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Web only: expo-sqlite's web build imports a .wasm file (docs.expo.dev/versions/latest/sdk/sqlite/#web-setup).
config.resolver.assetExts.push('wasm');

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

// Web only: react-native-web 0.21 ships InputAccessoryView, and Uniwind 1.12's
// web wrapper for it imports react-native-web back, a require cycle that crashes
// at startup. Leave that one export unwrapped on web. Native resolution is untouched.
const uniwindResolve = uniwindConfig.resolver.resolveRequest;
const path = require('path');
const sqliteChannelFix = path.join(__dirname, 'web-preview', 'sqlite-worker-channel.js');
uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === './exports/InputAccessoryView' && context.originModulePath.includes('react-native-web')) {
    return context.resolveRequest(context, moduleName, platform);
  }
  // Web only: expo-sqlite 57.0.3's sync channel truncates results over 255 bytes.
  // Swap in a fixed copy (web-preview/sqlite-worker-channel.js); its own relative
  // imports resolve from expo-sqlite/web as before.
  if (platform === 'web' && context.originModulePath.includes(`expo-sqlite${path.sep}web${path.sep}`) && moduleName === './WorkerChannel') {
    return { type: 'sourceFile', filePath: sqliteChannelFix };
  }
  if (platform === 'web' && context.originModulePath === sqliteChannelFix) {
    const origin = path.join(path.dirname(require.resolve('expo-sqlite/package.json')), 'web', 'WorkerChannel.ts');
    return context.resolveRequest({ ...context, originModulePath: origin }, moduleName, platform);
  }
  return uniwindResolve(context, moduleName, platform);
};

module.exports = uniwindConfig;
