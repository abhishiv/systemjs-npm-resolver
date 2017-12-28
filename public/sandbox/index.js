function configureSystemJS(config) {
  console.log('config', config)
  return new Promise(function(resolve, reject) {
    SystemJS.config(config)
    resolve({})
  })
}

function computeConfigPackages(manifest) {
  return Object.keys(manifest).reduce(function(state, packageName) {
    var pkg = manifest[packageName]
    var key = 'npm:' + packageName
    var map = Object.keys(pkg.dependencies || {}).reduce(function(state, dependencyName) {
      state[dependencyName] = 'npm:' + dependencyName + '@' + pkg.dependencies[dependencyName]
      return state
    }, {})
    state[key] = {
      meta: {
        '*': {
          'globals': {
            'process': 'process'
          }
        }
      },
      defaultExtension: 'js',
      main: pkg.main,
      format: pkg.format || 'cjs',
      map: Object.assign({}, map, pkg.map || {}, {
        'process': 'npm:jspm-nodelibs-process@0.2.1',
        'tty': 'npm:jspm-nodelibs-tty@0.2.1',
        'util': 'npm:jspm-nodelibs-util@0.2.2',
        'path': 'npm:jspm-nodelibs-path@0.2.3',
        'crypto': 'npm:jspm-nodelibs-crypto@0.2.1',
        'vm': 'npm:jspm-nodelibs-vm@0.2.1',
        'fs': 'npm:jspm-nodelibs-fs@0.2.1',
        'net': 'npm:jspm-nodelibs-net@0.2.1',
        'events': 'npm:jspm-nodelibs-events@0.2.2',
        'stream': 'npm:jspm-nodelibs-stream@0.2.1'
      })
    }
    return state
  }, {})
}
function computeConfigMap(manifest) {
  return Object.keys(manifest).reduce(function(state, packageName) {
    var key = packageName[0] === '@' ? '@' + packageName.split('@')[1] : packageName.split('@')[0]
    state[key] = 'npm:' + packageName
    return state
  }, {
    'process': 'jspm-nodelibs-process@0.2.1',
    'tty': 'jspm-nodelibs-tty@0.2.1',
    'util': 'jspm-nodelibs-util@0.2.2',
    'path': 'jspm-nodelibs-path@0.2.3',
    'crypto': 'jspm-nodelibs-crypto@0.2.1',
    'buffer': 'jspm-nodelibs-buffer@0.2.3',
    'fs': 'jspm-nodelibs-fs@0.2.1',
    'stream': 'jspm-nodelibs-stream@0.2.1',
    'net': 'jspm-nodelibs-net@0.2.1',
    'vm': 'jspm-nodelibs-vm@0.2.1',
    'events': 'jspm-nodelibs-events@0.2.2',
    'plugin-json': 'boot/lib/loaders/json.js'
  })
}

function prepareConfig(manifest) {
  return new Promise(function(resolve, reject) {
    var map = computeConfigMap(manifest)
    var packages = computeConfigPackages(manifest)
    resolve({
      paths: {
        'npm:': 'https://unpkg.com/',
        '*': 'https://cdn.jsdelivr.net/npm/',
      },
      packages: packages,
      map: map,
      meta: {
        '*.json': { loader: 'plugin-json' }
      }
    })
  })
}

function fetchManifest() {
  return fetch('./boot/m.json').then(function(resp) {
    if (resp.status === 200) {
      return resp.json()
    } else {
      throw new Error('Network error')
    }
  })
}

function boot() {
  return new Promise(function(resolve, reject) {
    fetchManifest().then(function(manifest) {
      prepareConfig(manifest).then(function(config) {
        configureSystemJS(config).then(function() {
          var db = localforage.createInstance({
            driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
            name: 'gratico-loader-cache'
          })
          console.log('d', db)
          resolve({
            config: config,
            db: db
          })
        }).catch(reject)
      }).catch(reject)
    }).catch(reject)
  })
}

var bootModule = {
  boot: boot
}

function responsify(txt) {
  return {
    ok: true,
    text: function() {
      return txt
    }
  }
}

// TODO fetch from unpkg if fails
function setSystemJsFetch(db) {
  window.systemjs_fetch = function(url, opts) {
    return new Promise(function(resolve, reject) {
      db.getItem(url).then(function(item) {
        if (item) {
          resolve(responsify(item))
        } else {
          window.fetch(url, opts).then(function(res) {
            if (res.ok) {
              return res.text()
            } else {
              throw new Error('Fetch error: ' + res.status + ' ' + res.statusText)
            }
          }).then(function(txt) {
            db.setItem(url, txt).then(function() {
              resolve(responsify(txt))
            }).catch(reject)
          }).catch(function(err) {
            reject(err)
          })
        }
      }).catch(reject)
    })
  }
}

function renderError(err) {
  console.log('e', err)
  document.querySelector('#root').innerHTML = '<div class="gratico-boot-error"><h1 style="font-weight: normal;">Unable to boot</h1><pre>' + (err.stack ? err.stack : '') + '</pre></div>'
}


bootModule.boot().then(function(ctx) {
  setSystemJsFetch(ctx.db)
  SystemJS.import('@gratico/paper').then(function(React) {
    console.log('loaded', React)
    document.querySelector('#root').innerHTML = '<div class="gratico-boot-success"><h1 style="font-weight: normal;">loaded</h1></div>'
  }).catch(renderError)
}).catch(renderError)
