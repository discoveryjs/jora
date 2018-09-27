// See an equivalent solution in plain JavaScript in npm-ls-in-js.js

const jora = require('../src');

function printTree(pkg, level = '') {
    console.log(level + pkg.name + '@' + pkg.version + (pkg.otherVersions.length ? ` [other versions: ${pkg.otherVersions.join(', ')}]` : ''));
    level = level.replace('└─ ', '   ').replace('├─ ', '│  ');
    pkg.dependencies.forEach((dep, idx, arr) => printTree(dep, level + (idx === arr.length - 1 ? '└─ ' : '├─ ')));
}

require('child_process')
    .exec('npm ls --json', {maxBuffer: 1024 * 1024}, (error, stdout) => {
        if (!stdout) {
            return;
        }

        try {
            const tree = JSON.parse(stdout);
            const multipleVersionPackages = jora`
                ..(dependencies.mapToArray("name"))
                .group(<name>, <version>)
                .({ name: key, versions: value.sort() })
                [versions.size() > 1]
            `(tree);

            const depsPathsToMultipleVersionPackages = jora`
                .({
                    name,
                    version,
                    otherVersions: #[name=@.name].versions - version,
                    dependencies: dependencies
                        .mapToArray("name")
                        .map(::self)
                        [name in #.name or dependencies]
                })
            `(tree, multipleVersionPackages);

            printTree(depsPathsToMultipleVersionPackages);
        } catch (e) {
            console.error('Error: ', e);
        }
    });
