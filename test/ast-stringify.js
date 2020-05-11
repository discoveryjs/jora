const assert = require('assert');
const { syntax: { parse, stringify } } = require('./helpers/lib');

describe('stringify', () => {
    it('basic test', () => {
        const source = [
            '$foo:true;$a:false;$c;$;$d:d.e;$f:$["f"];',
            'bar([#,@,not $,1,"2\'\\"",/3/i,/asd/],{a:3,$b,$,c,"asd":3,["asd"+x]:3,...,...foo,...(a+5)},<foo+4>,',
            'x?1 in xx():2,sort((($x;$x+b)*7) asc,b desc)).(a.[foo]).x($[a+"asd"],$[foo])',
            '..foo..bar()..baz(1,2,3)..(foo+bar)..(foo.bar())',
            '.(foo[1:2][::2][1:][:][1::-2]).([:2])',
            '.({foo:a|b,bar:a|$x;y})',
            '.map(=>$["abc"] or $[abc] or $[])',
            '.reduce(=>$$+$)'
        ].join('');
        const actual = stringify(parse(source).ast);

        assert.equal(actual, source);
    });
});
