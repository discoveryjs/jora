const chalk = require('chalk');
const libPaths = {
    'src': 'src/index.js',
    'dist': 'dist/jora.js',
    'dist-min': 'dist/jora.min.js'
};
const mode = libPaths.hasOwnProperty(process.env.MODE) ? process.env.MODE : 'src';
const libPath = libPaths[mode];
const postfix = mode === 'src'
    ? (require('../../src/parse').bake ? ' [RAW]' : ' [BAKED]')
    : '';

console.info('Test lib entry:', chalk.yellow(libPath + postfix));

module.exports = require('../../' + libPath);
