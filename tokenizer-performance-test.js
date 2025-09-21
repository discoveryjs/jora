import legacyParser from './src/lang/parse-old.js';
import reworkParser from './src/lang/parser/index.js';

// Large test query to demonstrate performance
const testQuery = `
users.[
    @.name,
    @.email,
    @.posts.filter(@.published = true).map(@.title),
    @.followers.size(),
    @.settings.notifications has "email",
    @.profile.avatar ~= /\\.jpg$/,
    @.createdAt >= "2023-01-01",
    @.tags.group(=> @).entries().map(=> { tag: key, count: value.size() }),
    posts.filter(@.author.id = $.id).sort(@.publishedAt desc).slice(0, 5),
    \`Hello \${@.name}, you have \${@.posts.size()} posts!\`,
    stats: {
        totalPosts: @.posts.size(),
        publishedPosts: @.posts.filter(@.published).size(),
        avgViews: @.posts.avg(@.views),
        topTag: @.posts.map(@.tags).flatten().group(=> @).entries().sort(value.size() desc).0.key
    }
]
`.trim().repeat(10); // Repeat to make it larger

console.log(`Test query length: ${testQuery.length} characters`);
console.log('Running performance comparison...');

// Warm up
for (let i = 0; i < 5; i++) {
    Array.from(legacyParser.tokenize(testQuery));
    reworkParser.tokenize(testQuery);
}

// Test legacy tokenizer
const legacyRuns = [];
for (let i = 0; i < 100; i++) {
    const start = performance.now();
    Array.from(legacyParser.tokenize(testQuery));
    const end = performance.now();
    legacyRuns.push(end - start);
}

// Test new tokenizer
const newRuns = [];
for (let i = 0; i < 100; i++) {
    const start = performance.now();
    reworkParser.tokenize(testQuery);
    const end = performance.now();
    newRuns.push(end - start);
}

// Calculate statistics
const avgLegacy = legacyRuns.reduce((a, b) => a + b, 0) / legacyRuns.length;
const avgNew = newRuns.reduce((a, b) => a + b, 0) / newRuns.length;
const minLegacy = Math.min(...legacyRuns);
const minNew = Math.min(...newRuns);
const improvement = ((avgLegacy - avgNew) / avgLegacy * 100);

console.log('\n=== PERFORMANCE RESULTS ===');
console.log('Legacy tokenizer:');
console.log(`  Average: ${avgLegacy.toFixed(3)}ms`);
console.log(`  Minimum: ${minLegacy.toFixed(3)}ms`);
console.log('New tokenizer:');
console.log(`  Average: ${avgNew.toFixed(3)}ms`);
console.log(`  Minimum: ${minNew.toFixed(3)}ms`);
console.log(`\nPerformance improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);

// Verify correctness
const legacyTokens = Array.from(legacyParser.tokenize(testQuery));
const newTokens = reworkParser.tokenize(testQuery);

console.log('\n=== CORRECTNESS CHECK ===');
console.log(`Legacy tokens: ${legacyTokens.length}`);
console.log(`New tokens: ${newTokens.length}`);
console.log(`Match: ${legacyTokens.length === newTokens.length ? '✅' : '❌'}`);
