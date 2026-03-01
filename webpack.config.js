const createExpoWebpackConfigAsync = require('@expo/webpack-config')

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  
  // Fix import.meta errors by injecting a polyfill
  config.plugins.push(
    new config.webpack.DefinePlugin({
      'import.meta': '{}'
    })
  )
  
  // Handle SQL files and other assets
  config.module.rules.push({
    test: /\.sql$/,
    use: 'raw-loader'
  })
  
  return config
}
