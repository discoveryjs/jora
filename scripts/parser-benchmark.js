/**
 * Performance benchmark comparing original jison parser vs new pure JS parser
 */

const originalPath = '../src/lang/parse-old.js';
const newParserPath = '../src/lang/parser/index.js';

// Test queries of varying complexity
const testQueries = [
    '@',
    '@.name',
    '@[name]',
    '@.items.size()',
    '@.items[value > 10]',
    '@.items.sort(value desc).slice(0, 5)',
    '@.items.[value > threshold].map({ key: name, val: value * 2 })',
    '@.data | { users: .users.size(), posts: .posts.size(), total: (.users.size() + .posts.size()) }',
    '$a: 10; $b: 20; `template${$a + $b * 2} continue ${value.group(=>something) | sort(value.size() desc).size() |? ($ * 100 / 123.123) + "%" : "nono"}`',
    '$ in @.items ? @ : null'
];

const iterations = 10000;

async function benchmarkParser(parserName, modulePath) {
    console.log(`\nBenchmarking ${parserName} (${iterations} iterations per query)...`);

    // Dynamic import to get fresh module
    const jora = await import(modulePath);
    const times = [];

    for (const query of testQueries) {
        const start = performance.now();

        try {
            for (let i = 0; i < iterations; i++) {
                jora.default.parse(query);
            }
        } catch (e) {
            console.error('===============================');
            console.error('Bad query:', query);
            console.error(e);
            console.error('===============================');
        }

        const time = performance.now() - start;
        times.push(time);

        console.log(
            `  ${query.replace(/^(.{39}).+/, '$1…').padEnd(40)} : ${time.toFixed(2)}ms (${(
                time / iterations
            ).toFixed(4)}ms/op)`
        );
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(
        `  Average per query: ${(totalTime / testQueries.length).toFixed(2)}ms`
    );

    return totalTime;
}

async function runBenchmark() {
    console.log(
        `Running benchmark with ${iterations} iterations per query...\n`
    );

    // Test original parser
    const originalTime = await benchmarkParser('Original Jison Parser', originalPath);

    // Test new parser
    const newTime = await benchmarkParser('New Pure JS Parser', newParserPath);

    // Calculate improvement
    const improvement = ((originalTime - newTime) / originalTime) * 100;
    const improvementTimes = improvement > 0
        ? (originalTime / newTime).toFixed(1)
        : (newTime / originalTime).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK RESULTS:');
    console.log(`Original Parser: ${originalTime.toFixed(2)}ms`);
    console.log(`New Parser:      ${newTime.toFixed(2)}ms`);

    if (improvement > 0) {
        console.log(`Improvement:     ${improvement.toFixed(1)}% / ${improvementTimes}x faster`);
    } else {
        console.log(
            `Difference:      ${Math.abs(improvement).toFixed(1)}% / ${improvementTimes}x slower`
        );
    }
}

runBenchmark().catch(console.error);
