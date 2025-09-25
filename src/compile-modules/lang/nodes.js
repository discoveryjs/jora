export function Arg1(range) {
    return {
        type: 'Arg1',
        range
    };
};
export function Array(elements, range) {
    return {
        type: 'Array',
        elements,
        range
    };
};
export function Assertion(assertion, negation = false, range) {
    return {
        type: 'Assertion',
        negation,
        assertion,
        range
    };
};
export function Binary(operator, left, right, range) {
    return {
        type: 'Binary',
        operator,
        left,
        right,
        range
    };
};
export function Block(definitions, body, range) {
    return {
        type: 'Block',
        definitions,
        body,
        range
    };
};
export function Compare(query, order, range) {
    return {
        type: 'Compare',
        query,
        order,
        range
    };
};
export function CompareFunction(compares, range) {
    return {
        type: 'CompareFunction',
        compares,
        range
    };
};
export function Conditional(test, consequent, alternate, range) {
    return {
        type: 'Conditional',
        test,
        consequent,
        alternate,
        range
    };
};
export function Context(range) {
    return {
        type: 'Context',
        range
    };
};
export function Current(range) {
    return {
        type: 'Current',
        range
    };
};
export function Data(range) {
    return {
        type: 'Data',
        range
    };
};
export function Declarator(name, range) {
    return {
        type: 'Declarator',
        name,
        range
    };
};
export function Definition(declarator, value, range) {
    return {
        type: 'Definition',
        declarator,
        value,
        range
    };
};
export function Filter(value, query, range) {
    return {
        type: 'Filter',
        value,
        query,
        range
    };
};
export function Function(args, body, range) {
    return {
        type: 'Function',
        arguments: args,
        body,
        range
    };
};
export function GetProperty(value, property, range) {
    return {
        type: 'GetProperty',
        value,
        property,
        range
    };
};
export function Identifier(name, range) {
    return {
        type: 'Identifier',
        name,
        range
    };
};
export function Literal(value, range) {
    return {
        type: 'Literal',
        value,
        range
    };
};
export function Map(value, query, range) {
    return {
        type: 'Map',
        value,
        query,
        range
    };
};
export function MapRecursive(value, query, range) {
    return {
        type: 'MapRecursive',
        value,
        query,
        range
    };
};
export function Method(reference, args, range) {
    return {
        type: 'Method',
        reference,
        arguments: args,
        range
    };
};
export function MethodCall(value, method, range) {
    return {
        type: 'MethodCall',
        value,
        method,
        range
    };
};
export function Object(properties, range) {
    return {
        type: 'Object',
        properties,
        range
    };
};
export function ObjectEntry(key, value, range) {
    return {
        type: 'ObjectEntry',
        key,
        value,
        range
    };
};
export function Parentheses(body, range) {
    return {
        type: 'Parentheses',
        body,
        range
    };
};
export function Pick(value, getter, range) {
    return {
        type: 'Pick',
        value,
        getter,
        range
    };
};
export function Pipeline(left, right, range) {
    return {
        type: 'Pipeline',
        left,
        right,
        range
    };
};
export function Placeholder(range) {
    return {
        type: 'Placeholder',
        range
    };
};
export function Postfix(argument, operator, range) {
    return {
        type: 'Postfix',
        operator,
        argument,
        range
    };
};
export function Prefix(operator, argument, range) {
    return {
        type: 'Prefix',
        operator,
        argument,
        range
    };
};
export function Reference(name, range) {
    return {
        type: 'Reference',
        name,
        range
    };
};
export function SliceNotation(value, args, range) {
    return {
        type: 'SliceNotation',
        value,
        arguments: args,
        range
    };
};
export function Spread(query, array = false, range) {
    return {
        type: 'Spread',
        query,
        array,
        range
    };
};
export function Template(values, range) {
    return {
        type: 'Template',
        values,
        range
    };
};
