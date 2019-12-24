const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const commonjs = require('rollup-plugin-commonjs');
const { terser } = require('rollup-plugin-terser');

function replaceContent(map) {
    return {
        name: 'file-content-replacement',
        load(id) {
            const key = path.relative('', id);
            if (map.hasOwnProperty(key)) {
                return map[key](id);
            }
        }
    };
};

module.exports = {
    input: 'src/index.js',
    output: [
        { name: 'jora', format: 'umd', file: 'dist/jora.js' },
        { name: 'jora', format: 'umd', file: 'dist/jora.min.js' }
    ],
    plugins: [
        resolve({ browser: true }),
        replaceContent({
            'src/lang/parse.js': id => require(id).generateModule(),
            'package.json': id => `{ "version": "${require(id).version}" }`
        }),
        commonjs(),
        json(),
        terser({ include: /\.min\./ })
    ]
};
