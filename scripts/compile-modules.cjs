const fs = require('fs');

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
