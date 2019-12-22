const chalk = require('chalk');
const libPaths = {
    'src': 'src/index.js',
    'dist': 'dist/jora.js',
    'dist-min': 'dist/jora.min.js'
};
const libPath = libPaths[process.env.MODE] || libPaths.src;

console.info('Test lib entry:', chalk.yellow(libPath));

module.exports = require('../../' + libPath);
