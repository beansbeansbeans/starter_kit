var utils = require('./_utils'),
  nodeResolve = require('rollup-plugin-node-resolve'),
  commonjs = require('rollup-plugin-commonjs'),
  rollup = require( 'rollup' ),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  babel = require('rollup-plugin-babel'),
  sass = require('rollup-plugin-scss')

module.exports = function(options) {
  /**
   * Create a promise based on the result of the webpack compiling script
   */

  return new Promise(function(resolve, reject) {

    rollup.rollup({
      // The bundle's starting point. This file will be
      // included, along with the minimum necessary code
      // from its dependencies
      entry: './src/index.js',
      plugins: [
        sass({
          output: true
        }),
        babel({
          exclude: './node_modules/**',
        }),
        nodeResolve({
          jsnext: true,
          main: true
        }),
        commonjs({ 
          include: './node_modules/**',
          namedExports: { 
            './node_modules/underscore/underscore.js': ['values', 'debounce', 'difference', 'shuffle', 'defer']
          }
        })
      ]
    }).then( function ( bundle ) {

      // convert to valid es5 code with babel
      var result = bundle.generate({
        format: 'cjs',
        useStrict: false
      }).code

      mkdirp('./dist', function() {
        try {
          fs.writeFileSync(`./dist/${ global.library }.js`, result, 'utf8')
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }).catch(e =>{ utils.print(e, 'error') })
  })

}
