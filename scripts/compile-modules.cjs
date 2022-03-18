const fs = require('fs');
const path = require('path');

const files = [
    {
        input: [
            'package.json'
        ],
        output: 'src/version.js',
        content([fn]) {
            const { version } = JSON.parse(fs.readFileSync(fn));

            return `export const version = '${version}';\n`;
        }
    },
    {
        input: [
            'src/compile-modules/lang/nodes.cjs'
        ],
        output: 'src/lang/build.js',
        content([fn]) {
            return fs.readFileSync(fn, 'utf8')
                .replace(/exports.(\S+) = function/g, 'export function $1');
        }
    },
    {
        input: [
            'src/compile-modules/lang/grammar.cjs',
            'src/compile-modules/lang/parse-patch.cjs',
            'src/compile-modules/lang/parse.cjs'
        ],
        output: 'src/lang/parse.js',
        content(input) {
            for (const fn of input) {
                delete require.cache[path.resolve(fn)];
            }

            return require(path.resolve(input[2]))();
        }
    }
];

function compileFile(input, output, content) {
    const startTime = Date.now();

    fs.writeFileSync(output, content(input));

    console.log('Compiled module:', output, `in ${Date.now() - startTime} ms`);
}

function compile(watch = false) {
    for (const { input, output, content } of files) {
        compileFile(input, output, content);

        if (watch) {
            for (const fn of input) {
                fs.watchFile(fn, { interval: 250 }, () =>
                    compileFile(input, output, content)
                );
            }
        }
    }
}

module.exports = compile;

if (require.main === module) {
    const watchMode = process.argv.includes('--watch');

    compile(watchMode);
}
