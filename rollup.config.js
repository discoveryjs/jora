const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const commonjs = require('rollup-plugin-commonjs');

module.exports = {
    input: 'src/index.js',
    output: {
        file: 'dist/jora.js',
        name: 'jora',
        format: 'umd'
    },
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        json()
    ]
};
