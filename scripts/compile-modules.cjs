const fs = require('fs');

const { version } = JSON.parse(fs.readFileSync('package.json'));

fs.writeFileSync('src/version.js',
    `export const version = '${version}';\n`
);
fs.writeFileSync('src/lang/build.js',
    fs.readFileSync('src/compile-modules/lang/nodes.cjs', 'utf8')
        .replace(/exports.(\S+) = function/g, 'export function $1')
);
fs.writeFileSync('src/lang/parse.js',
    require('../src/compile-modules/lang/parse.cjs')()
);
