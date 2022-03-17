import esbuild from 'esbuild';

async function build() {
    await esbuild.build({
        entryPoints: ['src/index.js'],
        outfile: 'dist/jora.js',
        format: 'iife',
        globalName: 'jora',
        footer: { js: 'jora=jora.default;' },
        bundle: true,
        logLevel: 'info',
        minify: true,
        sourcemap: true
    });

    esbuild.build({
        entryPoints: ['src/index.js'],
        outfile: 'dist/jora.esm.js',
        format: 'esm',
        bundle: true,
        logLevel: 'info',
        minify: true,
        sourcemap: true
    });
}

build();
