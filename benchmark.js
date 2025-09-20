/**
 * Performance benchmark comparing original jison parser vs new pure JS parser
 */

const originalPath = './src/lang/parse-old.js';
const newParserPath = './src/lang/parser/index.js';

// Test queries of varying complexity
const testQueries = [
    '@',
    '@.name',
    '@[name]',
    '@.items.size()',
    '@.items[value > 10]',
    '@.items.group(<type>)',
    '@.items.sort(value desc).slice(0, 5)',
    '@.items.[value > threshold].map({ key: name, val: value * 2 })',
    '@.data | { users: .users.size(), posts: .posts.size(), total: (.users.size() + .posts.size()) }',
    '$ in @.items ? @ : null'
];

const iterations = 10000;

async function benchmarkParser(parserName, modulePath) {
    console.log(`\nBenchmarking ${parserName}...`);

    // Dynamic import to get fresh module
    const jora = await import(modulePath);

    const times = [];

    for (const query of testQueries) {
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            try {
                jora.default(query);
            } catch (error) {
                // Some queries might fail parsing, that's ok for benchmarking
            }
        }

        const end = performance.now();
        const time = end - start;
        times.push(time);

        console.log(
            `  ${query.padEnd(40)} : ${time.toFixed(2)}ms (${(
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

    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK RESULTS:');
    console.log(`Original Parser: ${originalTime.toFixed(2)}ms`);
    console.log(`New Parser:      ${newTime.toFixed(2)}ms`);

    if (improvement > 0) {
        console.log(`Improvement:     ${improvement.toFixed(1)}% faster`);
    } else {
        console.log(
            `Difference:      ${Math.abs(improvement).toFixed(1)}% slower`
        );
    }
}

runBenchmark().catch(console.error);
