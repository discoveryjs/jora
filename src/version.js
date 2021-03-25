const fs = require('fs');

module.exports = {
    version: require('../package.json').version,
    generateModule() {
        return 'module.exports = ' + JSON.stringify(module.exports, null, 4) + ';';
    },
    bake() {
        fs.writeFileSync(__filename, module.exports.generateModule());
    }
};
