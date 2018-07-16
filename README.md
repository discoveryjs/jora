# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/lahmatiy/jora.svg?branch=master)](https://travis-ci.org/lahmatiy/jora)
[![Coverage Status](https://coveralls.io/repos/github/lahmatiy/jora/badge.svg?branch=master)](https://coveralls.io/github/lahmatiy/jora?branch=master)

JavaScript object sample query engine

## Quick demo

Fetch npm dependencies that have more than one version.

```js
const jora = require('../src');

require('child_process')
    .exec('npm ls --json', (error, stdout) => {
        if (error) {
            return;
        }

        const npmTree = JSON.parse(stdout);
        console.log(
            jora(`
                ..(
                    dependencies
                        .entries()
                        .({
                            name: key,
                            ...value
                        })
                )
                .group(<name>, <version>)[value.size() > 1]
                .({ name: key, versions: value.sort() })
            `)(npmTree)
        );
    });
```

Example of output:

```
[ { name: 'glob', versions: [ '5.0.15', '7.1.2' ] },
  { name: 'inherits', versions: [ '2.0.1', '2.0.3' ] },
  { name: 'punycode', versions: [ '1.3.2', '1.4.1' ] },
  { name: 'resolve', versions: [ '1.1.7', '1.8.1' ] },
  { name: 'util', versions: [ '0.10.3', '0.10.4' ] },
  { name: 'minimist', versions: [ '0.0.8', '1.2.0' ] },
  { name: 'escodegen', versions: [ '1.3.3', '1.8.1' ] },
  { name: 'esprima', versions: [ '1.1.1', '2.7.3', '4.0.1' ] },
  { name: 'supports-color', versions: [ '3.2.3', '5.4.0' ] },
  { name: 'wordwrap', versions: [ '0.0.2', '0.0.3', '1.0.0' ] },
  { name: 'commander', versions: [ '2.13.0', '2.15.1' ] },
  { name: 'source-map',
    versions: [ '0.1.43', '0.2.0', '0.4.4', '0.5.7', '0.6.1' ] },
  { name: 'isarray', versions: [ '1.0.0', '2.0.4' ] },
  { name: 'estraverse', versions: [ '1.5.1', '1.9.3' ] },
  { name: 'esutils', versions: [ '1.0.0', '2.0.2' ] },
  { name: 'has-flag', versions: [ '1.0.0', '3.0.0' ] } ]
```

## License

MIT
