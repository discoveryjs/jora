import legacyParser from '../src/lang/parse-old.js';
import newParser from '../src/lang/parser/index.js';

// Test comprehensive query from user request
const query = '$foo:true;$a:false;$c;$;$d:d.e;$f:$["f"];bar([#,@,null,undefined,Infinity,NaN,not $,no $,1,"2\'\\""' +
',/3/i,/asd/],{a:3,$b,$,c,$d:1,"asd":3,["asd"+x]:3,...,...$,...foo,...(a+5)},{$\\u0061:"ok"},' +
'`template`,`temp${1}late`,`te${1+1}mp${{a:3}["a"]+`xxx${42}xxx`}late`,`${1}${2} ${3}${4} ${5}${6}`,' +
'`${} ${} ${}`,[...,...$,...1+1],x?1 in xx():2,sort((($x;$x+b)*7) asc,b desc)).(a.[foo]).x($[a+"asd"],$[foo])' +
'.conditional(1?2:3,1?2:,1?2,1?:3,1?:,1?,?)..foo..bar()..baz(1,2,3)..(foo+bar)..(foo.bar())' +
'.(foo[1:2][::2][1:][:][1::-2]).([:2]).($[:2]).({foo:a|b,bar:a|$x;y}).map(=>$["abc"] or $[abc] or $[])' +
'.map().().[]..()..a..a()[].map([foo,$.foo,method(),$.method(),.(),$.(),.[],$.[],..(),..a,..a(),..$a(),$..(),$..a,$..a(),..($),..($+[]),..(a() or b())])' +
'.assert(is test,is not test,is (test),is not (test),is (test or bar),is (test and bar),is not (not test or not (bar) or not baz),is (test or (foo and bar) or not (not foo and (bar or baz))))' +
'.reduce(=>$$+$)';

function compareTokenizers() {
    console.log('=== TOKEN-BY-TOKEN COMPARISON ===');
    console.log('Query length:', query.length);

    // Get tokens from both tokenizers
    const legacyTokens = [...legacyParser.tokenize(query)];
    const newTokens = [...newParser.tokenize(query)];

    console.log(`Legacy tokens: ${legacyTokens.length}`);
    console.log(`New tokens: ${newTokens.length}`);

    // Compare token by token
    const maxLength = Math.max(legacyTokens.length, newTokens.length);
    let firstDifference = -1;

    for (let i = 0; i < maxLength; i++) {
        const legacy = legacyTokens[i];
        const newToken = newTokens[i];

        if (!legacy || !newToken ||
            legacy.type !== newToken.name ||
            legacy.value !== newToken.value ||
            legacy.offset !== newToken.offset) {
            firstDifference = i;
            break;
        }
    }

    if (firstDifference === -1) {
        console.log('✅ All tokens match perfectly!');
        return;
    }

    console.log(`\n❌ First difference at position ${firstDifference}:`);

    // Show context around the difference
    const start = Math.max(0, firstDifference - 3);
    const end = Math.min(maxLength, firstDifference + 4);

    console.log('\nContext:');
    for (let i = start; i < end; i++) {
        const legacy = legacyTokens[i];
        const newToken = newTokens[i];

        const legacyStr = legacy ? `${legacy.type}:"${legacy.value}"` : 'MISSING';
        const newStr = newToken ? `${newToken.name}:"${newToken.value}"` : 'MISSING';

        const marker = i === firstDifference ? ' <<< DIFFERENCE' : '';

        console.log(`${i.toString().padStart(3)}: Legacy: ${legacyStr.padEnd(25)} | New: ${newStr}${marker}`);

        // Show full JSON for the differing tokens
        if (i === firstDifference) {
            console.log(`      Legacy JSON: ${JSON.stringify(legacy)}`);
            console.log(`      New JSON:    ${JSON.stringify(newToken)}`);
        }
    }

    // Show position in query where difference occurs
    if (firstDifference < legacyTokens.length && legacyTokens[firstDifference].offset !== undefined) {
        const offset = legacyTokens[firstDifference].offset;
        const contextStart = Math.max(0, offset - 20);
        const contextEnd = Math.min(query.length, offset + 20);

        console.log(`\nQuery context at position ${offset}:`);
        console.log(`"${query.slice(contextStart, contextEnd)}"`);
        console.log(' '.repeat(offset - contextStart) + '^');
    }
}

try {
    compareTokenizers();
} catch (error) {
    console.error('Error during comparison:', error.message);
    console.error(error.stack);
}
