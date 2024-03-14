/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '20'
        }
      }
    ]
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '~': '.'
        }
      }
    ]
  ],
  env: {
    development: {
      sourceMaps: 'inline',
      retainLines: true
    }
  }
}
