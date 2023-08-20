export default [
    '$foo:true;$a:false;$c;$;$d:d.e;$f:$["f"];',
    'bar([#,@,null,undefined,Infinity,NaN,not $,no $,1,"2\'\\"",/3/i,/asd/],{a:3,$b,$,c,$d:1,"asd":3,["asd"+x]:3,...,...$,...foo,...(a+5)},<foo+4>,',
    '`template`,`temp${1}late`,`te${1+1}mp${{a:3}["a"]+`xxx${42}xxx`}late`,`${1}${2} ${3}${4} ${5}${6}`,`${} ${} ${}`,',
    '[...,...$,...1+1],',
    'x?1 in xx():2,sort((($x;$x+b)*7) asc,b desc)).(a.[foo]).x($[a+"asd"],$[foo])',
    '..foo..bar()..baz(1,2,3)..(foo+bar)..(foo.bar())',
    '.(foo[1:2][::2][1:][:][1::-2]).([:2]).($[:2])',
    '.({foo:a|b,bar:a|$x;y})',
    '.map(=>$["abc"] or $[abc] or $[])',
    '.map().().[]..()..a..a()[]',
    '.map([foo,$.foo,method(),$.method(),.(),$.(),.[],$.[],..(),..a,..a(),..$a(),$..(),$..a,$..a(),..($),..($+[]),..(a() or b())])',
    '.assert(is test,is not test,is (test),is not (test),is (test or bar),is (test and bar),is not (not test or not (bar) or not baz),is (test or (foo and bar) or not (not foo and (bar or baz))))',
    '.reduce(=>$$+$)'
].join('');
