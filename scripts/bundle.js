const fs = require('fs');
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
            const content = fs.readFileSync(fn, 'utf8');
            genModuleCache.set(fn, /generateModule/.test(content)
                ? require(fn).generateModule()
                : content
            );
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
        format: 'iife',
        globalName: 'jora',
        bundle: true,
        logLevel: 'info',
        minify: true,
        sourcemap: true,
        plugins
    });
}

build();
