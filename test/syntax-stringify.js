const assert = require('assert');
const { syntax: { parse, stringify } } = require('../src');

describe('stringify', () => {
    it.only('basic test', () => {
        const source = '$foo:true;$a:false;$c;$;bar([1,"2\'\\"",/3/i,/asd/],{a:3,$b,$,c,"asd":3,["asd"+x]:3,...,...foo,...(a+5)},<foo+4>,x?1 in xx():2,sort((($x;$x+b)*7) asc,b desc)).(a.[foo]).x($[a+"asd"],$[foo])';
        const actual = stringify(parse(source).ast);

        assert.equal(actual, source);
    });
});
