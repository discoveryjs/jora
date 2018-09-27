# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/lahmatiy/jora.svg?branch=master)](https://travis-ci.org/lahmatiy/jora)
[![Coverage Status](https://coveralls.io/repos/github/lahmatiy/jora/badge.svg?branch=master)](https://coveralls.io/github/lahmatiy/jora?branch=master)

JavaScript object sample query engine

> STATUS: A proof of concept

## Quick demo

Get npm dependency paths (as a tree) that have packages with more than one version:

```js
const jora = require('../src');

function printTree() {
    // see implementation in examples/npm-ls.js
}

require('child_process')
    .exec('npm ls --json', (error, stdout) => {
        if (error) {
            return;
        }

        const npmTree = JSON.parse(stdout);
        const multipleVersionPackages = jora(`
            ..(dependencies.mapToArray("name"))
            .group(<name>, <version>)
            .({ name: key, versions: value })
            [versions.size() > 1]
        `)(npmTree);

        const depsPathsToMultipleVersionPackages = jora(`
            .({
                name,
                version,
                otherVersions: #[name=@.name].versions - version,
                dependencies: dependencies
                    .mapToArray("name")
                    .map(::self)
                    [name in #.name or dependencies]
            })
        `)(npmTree, multipleVersionPackages);

        printTree(depsPathsToMultipleVersionPackages);
    });
```

Example of output:

```
jora@1.0.0
├─ browserify@16.2.2
│  ├─ assert@1.4.1
│  │  └─ util@0.10.3 [other versions: 0.10.4]
│  │     └─ inherits@2.0.1 [other versions: 2.0.3]
│  ├─ browser-pack@6.1.0
│  │  └─ combine-source-map@0.8.0
│  │     ├─ source-map@0.5.7 [other versions: 0.6.1, 0.4.4, 0.2.0, 0.1.43]
│  │     └─ inline-source-map@0.6.2
│  │        └─ source-map@0.5.7 [other versions: 0.6.1, 0.4.4, 0.2.0, 0.1.43]
│  ├─ browser-resolve@1.11.3
│  │  └─ resolve@1.1.7 [other versions: 1.8.1]
│  ├─ concat-stream@1.6.2
│  │  └─ inherits@2.0.3 [other versions: 2.0.1]
│  ├─ crypto-browserify@3.12.0
│  │  ├─ browserify-cipher@1.0.1
│  │  │  ├─ browserify-aes@1.2.0
│  │  │  │  └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  │  └─ browserify-des@1.0.2
│  │  │     ├─ des.js@1.0.0
│  │  │     │  └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  │     └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  ├─ browserify-sign@4.0.4
...
```

## License

MIT
