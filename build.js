const fs = require('fs');
const esbuild = require('esbuild');
const log = async (outfile, fn) => {
    const start = Date.now();
    try {
        await fn(outfile);
    } finally {
        console.log(outfile, fs.statSync(outfile).size, 'bytes in', Date.now() - start, 'ms');
    }
};

async function build() {
    await log('dist/jora.js', (outfile) => esbuild.build({
        entryPoints: ['src/index.js'],
        outfile,
        format: 'cjs',
        bundle: true,
        metafile: 'dist/jora.meta.json',
        plugins: [{
            name: 'replace',
            setup({ onLoad }) {
                onLoad({ filter: /src\/lang\/parse\./ }, args => ({
                    contents: require(args.path).generateModule()
                }));
                onLoad({ filter: /package\.json/ }, args => ({
                    contents: 'module.exports = ' + JSON.stringify({
                        version: require(args.path).version
                    })
                }));
            }
        }]
    }));

    await log('dist/jora.min.js', (outfile) => esbuild.build({
        entryPoints: ['dist/jora.js'],
        outfile,
        format: 'cjs',
        minify: true
    }));
}

build();
