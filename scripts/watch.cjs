const compileModules = require('./compile-modules.cjs');
const esmToCjs = require('./esm-to-cjs.cjs');

compileModules(true);
esmToCjs(true);
