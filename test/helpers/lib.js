const chalk = require('chalk');
const libPaths = {
    'src': 'src/index.js',
    'dist': 'dist/jora.js',
    'dist-min': 'dist/jora.min.js'
};
const mode = process.env.MODE || 'src';
const libPath = libPaths[mode];
const postfix = mode === 'src'
    ? (require('../../src/lang/parse').bake ? ' [RAW]' : ' [BAKED]')
    : '';

if (!libPaths.hasOwnProperty(mode)) {
    console.error(`Mode ${chalk.white.bgRed(mode)} is not supported!\n`);
    process.exit(1);
}

console.info('Test lib entry:', chalk.yellow(libPath + postfix));

module.exports = require('../../' + libPath);
