/* istanbul ignore file */
const fs = require('fs');
const path = require('path');

module.exports = require('./parser-raw');
module.exports.bake = function() {
    return fs.writeFileSync(path.join(__dirname, 'parser.js'), module.exports.generateModule());
};
