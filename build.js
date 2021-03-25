const esbuild = require('esbuild');

async function build() {
    const genModules = [
        'src/version.js',
        'src/lang/parse.js'
    ];
    const genModulesFilter = new RegExp('(' + genModules.join('|').replace(/\./g, '\\.') + ')$');
    const genModuleCache = new Map();
    const genModule = (fn) => {
        if (!genModuleCache.has(fn)) {
            genModuleCache.set(fn, require(fn).generateModule());
        }
        return genModuleCache.get(fn);
    };
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModule(args.path)
            }));
        }
    }];

    await esbuild.build({
        entryPoints: ['src/index.js'],
        outfile: 'dist/jora.js',
        format: 'cjs',
        bundle: true,
        logLevel: 'info',
        plugins
    });

    esbuild.build({
        entryPoints: ['dist/jora.js'],
        outfile: 'dist/jora.min.js',
        format: 'cjs',
        logLevel: 'info',
        minify: true,
        plugins
    });
}

build();
