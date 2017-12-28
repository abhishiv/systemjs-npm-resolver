# Introduction

To see how it loads any npm package in browser via unpkg please visit the following link and open you console. Files are also cached into indexdb, so you can also check that.

[demo](https://rawgit.com/abhishiv/systemjs-npm-resolver/master/public/sandbox/index.html)

## Getting started

To build a manifest

```
npm run start '{"keese": null, "react": null}'
```

The last line of output should be [manifest](public/sandbox/boot/m.json) you can feed to [systemjs](public/sandbox/boot/m.json)

Open up [index.html](public/sandbox/index.html) and checkout [index.js](public/sandbox/index.js) to see how I feed this to systemjs

Tested with SystemJS v0.20.9.

Stable in my testing but use it at your own risk.

Open to contributions!