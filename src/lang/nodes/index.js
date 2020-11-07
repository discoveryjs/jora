const nodes = {
    Arg1: require('./Arg1'),
    Array: require('./Array'),
    Binary: require('./Binary'),
    Block: require('./Block'),
    Compare: require('./Compare'),
    Conditional: require('./Conditional'),
    Context: require('./Context'),
    Current: require('./Current'),
    Data: require('./Data'),
    Declarator: require('./Declarator'),
    Definition: require('./Definition'),
    Filter: require('./Filter'),
    Function: require('./Function'),
    GetProperty: require('./GetProperty'),
    Identifier: require('./Identifier'),
    Literal: require('./Literal'),
    Map: require('./Map'),
    MapRecursive: require('./MapRecursive'),
    Method: require('./Method'),
    MethodCall: require('./MethodCall'),
    Object: require('./Object'),
    ObjectEntry: require('./ObjectEntry'),
    Parentheses: require('./Parentheses'),
    Pick: require('./Pick'),
    Pipeline: require('./Pipeline'),
    Reference: require('./Reference'),
    SliceNotation: require('./SliceNotation'),
    SortingFunction: require('./SortingFunction'),
    Spread: require('./Spread'),
    Template: require('./Template'),
    Unary: require('./Unary')
};

const extract = type => new Map(
    Object.entries(nodes)
        .map(([key, value]) => [key, value[type]])
        .filter(([, value]) => typeof value === 'function')
);
const build = {};
extract('build').forEach(
    (value, key) => (build[key] = value)
);

module.exports = {
    nodes,
    build,
    compile: extract('compile'),
    walk: extract('walk'),
    stringify: extract('stringify'),
    suggest: extract('suggest')
};
