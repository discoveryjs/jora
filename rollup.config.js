const path = require('path');
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
        json(),
        {
            name: 'file-content-replacement',
            load(id) {
                switch (id) {
                    case path.resolve('src/parse.js'):
                        return require('./src/parse').generateModule();

                    case path.resolve('package.json'):
                        return `{ "version": "${
                            require('./package.json').version
                        }" }`;
                }
            }
        }
    ]
};
