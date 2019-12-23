/* istanbul ignore file */
const fs = require('fs');

module.exports = require('./parse-raw');
module.exports.bake = function() {
    return fs.writeFileSync(__filename, module.exports.generateModule());
};
