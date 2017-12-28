function handleError(err) {
  console.log('error', err)
  throw err
}

function fetchBundle(url) {
  return new Promise(function(resolve, reject) {
    fetch(url, {}).then(function(resp) {
      resp.text().then(function(bundle) {
        resolve(bundle)
      }).catch(reject)
    }).catch(reject)
  })
}

function fetchManifest(url) {
  return new Promise(function(resolve, reject) {
    fetch(url, {}).then(function(resp) {
      resp.json().then(function(manifest) {
        resolve(manifest)
      }).catch(reject)
    }).catch(reject)
  })
}

function evaluateBundle(bundle) {
  return eval(bundle + '\n dll_bundle;')
}

function getModule(manifest, webpack, moduleName) {
  var moduleIdentifier = manifest.externals[moduleName]
  if (moduleIdentifier) {
    var moduleId = parseInt(moduleIdentifier.match(/dll_bundle\((.*)\)/)[1])
    return webpack(moduleId)
  }
}

function boot(manifestURL, bundleURL) {
  return new Promise(function(resolve, reject) {
    fetchManifest(manifestURL).then(function(manifest) {
      fetchBundle(bundleURL).then(function(bundle) {
        var webpack = evaluateBundle(bundle)
        var require = getModule.bind(null, manifest, webpack)
        resolve(require)
      }).catch(reject)
    }).catch(reject)
  })
}

function evaluateCode(require, input) {
  var Babel = require('babel-standalone')
  var output = Babel.transform(input, { presets: ['es2015'] })
  const exports = {}
  window.eval.call(window, '(function (require, exports) {' + output.code + '})')(require, exports)
  return exports
}

var manifestURL = 'https://cdn.jsdelivr.net/webpack/v3/babel-standalone%406.24.2+react%4015.5.3+react-dom%4015.5.3+relay-runtime%401.0.0-rc.4+slate%400.20.1+underscore%401.8.3/manifest.json'
var bundleURL = 'https://cdn.jsdelivr.net/webpack/v3/babel-standalone%406.24.2+react%4015.5.3+react-dom%4015.5.3+relay-runtime%401.0.0-rc.4+slate%400.20.1+underscore%401.8.3/dll.js'
var input = 'import React from \'react\' \n export const a = 7 \n export default React'

boot(manifestURL, bundleURL).then(function(require) {
  const exports = evaluateCode(require, input)
  console.log('exports', exports)
}).catch(handleError)