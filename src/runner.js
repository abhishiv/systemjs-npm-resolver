const shell = require('pshell');
const path = require('path');
const fs = require('fs');
const lockfile = require('@yarnpkg/lockfile');

const fetchStdin = require('./shell');

const getFileTree = (dir, fileList = []) => {
  fs.readdirSync(dir).forEach(file => {
    if (file !== "node_modules") {
      const filePath = path.join(dir, file)
      fileList.push(
        fs.statSync(filePath).isDirectory()
          ? {[file]: getFileTree(filePath)}
          : file
      )
    }
  })
  return fileList
}

const jspmPackages = ["jspm-nodelibs-os", "jspm-nodelibs-string_decoder", "jspm-nodelibs-buffer", "jspm-nodelibs-zlib", "jspm-nodelibs-path", "jspm-nodelibs-events", "jspm-nodelibs-net", "jspm-nodelibs-fs", "jspm-nodelibs-vm", "jspm-nodelibs-url", "jspm-nodelibs-process", "jspm-nodelibs-stream", "jspm-nodelibs-crypto", "jspm-nodelibs-util", "jspm-nodelibs-constants", "jspm-nodelibs-child_process", "jspm-nodelibs-assert", "jspm-nodelibs-https", "jspm-nodelibs-tty", "jspm-nodelibs-querystring", "jspm-nodelibs-tls", "jspm-nodelibs-module", "jspm-nodelibs-console", "jspm-nodelibs-domain", "jspm-nodelibs-timers", "jspm-nodelibs-dns", "jspm-nodelibs-readline", "jspm-nodelibs-dgram", "jspm-nodelibs-cluster", "jspm-nodelibs-repl", "jspm-nodelibs-punycode"]

// TODO later include jspm-nodelibs-http as well

async function installDependencies(data) {
  console.log('data', data);
  let payload;
  try {
    payload = JSON.parse(data);
  } catch (e) {
    payload = {};
  }
  const packagesString = Object.keys(payload).reduce(function(state, packageName) {
    const version = payload[packageName];
    state = [
      ...state,
      (version ? packageName + '@' + version : packageName)
    ]
    return state;
  }, jspmPackages).join(' ');
  const cwd = path.join(__dirname, 'template');
  console.log('packagesString', packagesString);
  await shell(`npm install ${packagesString} --save`, {cwd})
  return payload;
}

function getMapFromFileTree(tree, parentPath=[]) {
  return tree.reduce(function(state, item) {
    const isFile = (typeof item === 'string')
    const obj = {}
    if (parentPath.length > 1 && tree.indexOf('index.js') > -1) {
      obj['./' + parentPath.join('/')] = './' + [...parentPath, 'index.js'].join('/')
    }
    return {
      ...state,
      ...obj,
      ...(isFile ? {} : Object.keys(item).reduce(function(state, key) {
        return {
          ...state,
          ...getMapFromFileTree(item[key], [...parentPath, key])
        }
      }, {}))
    }
  }, {});
}

function getPaddedPath(parentPath) {
  return parentPath.reduce(function(state, key, i) {
    return [
      ...state,
      key,
      ...(
        key[0] === "@" ? [] : (i === parentPath.length - 1 ? [] : ["node_modules"])
      )
    ]
  }, [])
}

function serializePackageJSONFields(parentPath) {
  const paddedPath = getPaddedPath(parentPath);

  const p = path.join.apply(path, [__dirname, 'template', 'node_modules', ...paddedPath, "package.json"]);
  const file = fs.readFileSync(p.toString(), 'utf8').toString()
  let json = JSON.parse(file);
  const tree = getFileTree(path.join.apply(path, [__dirname, 'template', 'node_modules', ...paddedPath]))
  return {
    browser: json.browser,
    gratico: json.gratico,
    main: json.main || 'index.js',
    map: {
      ...(json.jspmNodeConversion === false ? json.map : {}),
      ...getMapFromFileTree(tree)
    }
  }
}

function serializeDependencies(dependencies, parentPath, state) {
  return Object.keys(dependencies).reduce(function(state, key) {
    const pkg = dependencies[key];
    const currentPath = [...parentPath, ...key.split("/")];
    return {
      ...state,
      [key + "@" + pkg.version]: {
        version: pkg.version,
        dependencies: pkg.requires || {},
        ...serializePackageJSONFields(currentPath)
      },
      ...serializeDependencies(pkg.dependencies || {}, currentPath, {})
    }
  }, state)
}

async function getResolvedPackages() {
  const p = path.join(__dirname, 'template', 'package-lock.json');
  const file = fs.readFileSync(p.toString(), 'utf8').toString()
  let json = JSON.parse(file);
  return serializeDependencies(json.dependencies, [], {})
}

(async function() {
  /*
  const proxyPort = 3500;
  const server = await startServer(proxyPort);
  server.close();
  */
  // const data = `{"keese": null, "@gratico/paper": null}`
  const data = await fetchStdin();
  const payload = await installDependencies(data);
  const manifest = await getResolvedPackages()
  console.log('manifest computed');
  console.log(JSON.stringify({payload: payload, manifest: manifest}));
})()
