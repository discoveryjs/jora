exports.Arg1 = function() {
    return {
        type: 'Arg1'
    };
};
exports.Array = function(elements) {
    return {
        type: 'Array',
        elements
    };
};
exports.Binary = function(operator, left, right) {
    return {
        type: 'Binary',
        operator,
        left,
        right
    };
};
exports.Block = function(definitions, body) {
    return {
        type: 'Block',
        definitions,
        body
    };
};
exports.Compare = function(query, order) {
    return {
        type: 'Compare',
        query,
        order
    };
};
exports.CompareFunction = function(compares) {
    return {
        type: 'CompareFunction',
        compares
    };
};
exports.Conditional = function(test, consequent, alternate) {
    return {
        type: 'Conditional',
        test,
        consequent,
        alternate
    };
};
exports.Context = function() {
    return {
        type: 'Context'
    };
};
exports.Current = function() {
    return {
        type: 'Current'
    };
};
exports.Data = function() {
    return {
        type: 'Data'
    };
};
exports.Declarator = function(name) {
    return {
        type: 'Declarator',
        name
    };
};
exports.Definition = function(declarator, value) {
    return {
        type: 'Definition',
        declarator,
        value
    };
};
exports.Filter = function(value, query) {
    return {
        type: 'Filter',
        value,
        query
    };
};
exports.Function = function(args, body, legacy) {
    return {
        type: 'Function',
        arguments: args,
        body,
        legacy: Boolean(legacy)
    };
};
exports.GetProperty = function(value, property) {
    return {
        type: 'GetProperty',
        value,
        property
    };
};
exports.Identifier = function(name) {
    return {
        type: 'Identifier',
        name
    };
};
exports.Literal = function(value) {
    return {
        type: 'Literal',
        value
    };
};
exports.Map = function(value, query) {
    return {
        type: 'Map',
        value,
        query
    };
};
exports.MapRecursive = function(value, query) {
    return {
        type: 'MapRecursive',
        value,
        query
    };
};
exports.Method = function(reference, args) {
    return {
        type: 'Method',
        reference,
        arguments: args
    };
};
exports.MethodCall = function(value, method) {
    return {
        type: 'MethodCall',
        value,
        method
    };
};
exports.Object = function(properties) {
    return {
        type: 'Object',
        properties
    };
};
exports.ObjectEntry = function(key, value) {
    return {
        type: 'ObjectEntry',
        key,
        value
    };
};
exports.Parentheses = function(body) {
    return {
        type: 'Parentheses',
        body
    };
};
exports.Pick = function(value, getter) {
    return {
        type: 'Pick',
        value,
        getter
    };
};
exports.Pipeline = function(left, right) {
    return {
        type: 'Pipeline',
        left,
        right
    };
};
exports.Placeholder = function() {
    return {
        type: 'Placeholder'
    };
};
exports.Reference = function(name) {
    return {
        type: 'Reference',
        name
    };
};
exports.SliceNotation = function(value, args) {
    return {
        type: 'SliceNotation',
        value,
        arguments: args
    };
};
exports.Spread = function(query, array = false) {
    return {
        type: 'Spread',
        query,
        array
    };
};
exports.Template = function(values) {
    return {
        type: 'Template',
        values
    };
};
exports.Unary = function(operator, argument) {
    return {
        type: 'Unary',
        operator,
        argument
    };
};
