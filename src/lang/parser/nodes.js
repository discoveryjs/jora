export function Arg1() {
    return {
        type: 'Arg1'
    };
};
export function Array(elements) {
    return {
        type: 'Array',
        elements
    };
};
export function Assertion(assertion, negation = false) {
    return {
        type: 'Assertion',
        negation,
        assertion
    };
};
export function Binary(operator, left, right) {
    return {
        type: 'Binary',
        operator,
        left,
        right
    };
};
export function Block(definitions, body) {
    return {
        type: 'Block',
        definitions,
        body
    };
};
export function Compare(query, order) {
    return {
        type: 'Compare',
        query,
        order
    };
};
export function CompareFunction(compares) {
    return {
        type: 'CompareFunction',
        compares
    };
};
export function Conditional(test, consequent, alternate) {
    return {
        type: 'Conditional',
        test,
        consequent,
        alternate
    };
};
export function Context() {
    return {
        type: 'Context'
    };
};
export function Current() {
    return {
        type: 'Current'
    };
};
export function Data() {
    return {
        type: 'Data'
    };
};
export function Declarator(name) {
    return {
        type: 'Declarator',
        name
    };
};
export function Definition(declarator, value) {
    return {
        type: 'Definition',
        declarator,
        value
    };
};
export function Filter(value, query) {
    return {
        type: 'Filter',
        value,
        query
    };
};
export function Function(args, body) {
    return {
        type: 'Function',
        arguments: args,
        body
    };
};
export function GetProperty(value, property) {
    return {
        type: 'GetProperty',
        value,
        property
    };
};
export function Identifier(name) {
    return {
        type: 'Identifier',
        name
    };
};
export function Literal(value) {
    return {
        type: 'Literal',
        value
    };
};
export function Map(value, query) {
    return {
        type: 'Map',
        value,
        query
    };
};
export function MapRecursive(value, query) {
    return {
        type: 'MapRecursive',
        value,
        query
    };
};
export function Method(reference, args) {
    return {
        type: 'Method',
        reference,
        arguments: args
    };
};
export function MethodCall(value, method) {
    return {
        type: 'MethodCall',
        value,
        method
    };
};
export function Object(properties) {
    return {
        type: 'Object',
        properties
    };
};
export function ObjectEntry(key, value) {
    return {
        type: 'ObjectEntry',
        key,
        value
    };
};
export function Parentheses(body) {
    return {
        type: 'Parentheses',
        body
    };
};
export function Pick(value, getter) {
    return {
        type: 'Pick',
        value,
        getter
    };
};
export function Pipeline(left, right) {
    return {
        type: 'Pipeline',
        left,
        right
    };
};
export function Placeholder() {
    return {
        type: 'Placeholder'
    };
};
export function Postfix(argument, operator) {
    return {
        type: 'Postfix',
        operator,
        argument
    };
};
export function Prefix(operator, argument) {
    return {
        type: 'Prefix',
        operator,
        argument
    };
};
export function Reference(name) {
    return {
        type: 'Reference',
        name
    };
};
export function SliceNotation(value, args) {
    return {
        type: 'SliceNotation',
        value,
        arguments: args
    };
};
export function Spread(query, array = false) {
    return {
        type: 'Spread',
        query,
        array
    };
};
export function Template(values) {
    return {
        type: 'Template',
        values
    };
};
