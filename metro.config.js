const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

config.resolver.assetExts.push('sql')

// Force zustand to its CJS build on web — the ESM build uses `import.meta.env`
// which is a syntax error in a classic (non-module) script context.
const _defaultResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('zustand/')) {
    const subpath = moduleName.slice('zustand/'.length)
    return {
      filePath: require.resolve(`./node_modules/zustand/${subpath}.js`),
      type: 'sourceFile',
    }
  }
  if (_defaultResolve) return _defaultResolve(context, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
