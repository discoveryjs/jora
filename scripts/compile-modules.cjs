const fs = require('fs');

const { version } = JSON.parse(fs.readFileSync('package.json'));

fs.writeFileSync('src/version.js',
    `export const version = '${version}';\n`
);

import('../src/compile-modules/lang/parse.js')
    .then(({ default: generateModule }) => {
        fs.writeFileSync('src/lang/parse.js', generateModule());
    });
