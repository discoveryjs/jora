import * as Arg1 from './Arg1.js';
import * as Array from './Array.js';
import * as Assertion from './Assertion.js';
import * as Binary from './Binary.js';
import * as Block from './Block.js';
import * as Compare from './Compare.js';
import * as CompareFunction from './CompareFunction.js';
import * as Conditional from './Conditional.js';
import * as Context from './Context.js';
import * as Current from './Current.js';
import * as Data from './Data.js';
import * as Declarator from './Declarator.js';
import * as Definition from './Definition.js';
import * as Filter from './Filter.js';
import * as Function from './Function.js';
import * as GetProperty from './GetProperty.js';
import * as Identifier from './Identifier.js';
import * as Literal from './Literal.js';
import * as MapNode from './Map.js';
import * as MapRecursive from './MapRecursive.js';
import * as Method from './Method.js';
import * as MethodCall from './MethodCall.js';
import * as ObjectNode from './Object.js';
import * as ObjectEntry from './ObjectEntry.js';
import * as Parentheses from './Parentheses.js';
import * as Pick from './Pick.js';
import * as Pipeline from './Pipeline.js';
import * as Placeholder from './Placeholder.js';
import * as Postfix from './Postfix.js';
import * as Prefix from './Prefix.js';
import * as Reference from './Reference.js';
import * as SliceNotation from './SliceNotation.js';
import * as Spread from './Spread.js';
import * as Template from './Template.js';

export const nodes = {
    Arg1,
    Array,
    Assertion,
    Binary,
    Block,
    Compare,
    Conditional,
    Context,
    Current,
    Data,
    Declarator,
    Definition,
    Filter,
    Function,
    GetProperty,
    Identifier,
    Literal,
    Map: MapNode,
    MapRecursive,
    Method,
    MethodCall,
    Object: ObjectNode,
    ObjectEntry,
    Parentheses,
    Pick,
    Pipeline,
    Placeholder,
    Postfix,
    Prefix,
    Reference,
    SliceNotation,
    CompareFunction,
    Spread,
    Template
};

const extract = type => new Map(
    Object.entries(nodes)
        .map(([key, value]) => [key, value[type]])
        .filter(([, value]) => typeof value === 'function')
);

export const build = {};
extract('build').forEach(
    (value, key) => (build[key] = value)
);

export const compile = extract('compile');
export const walk = extract('walk');
export const stringify = extract('stringify');
export const suggest = extract('suggest');
