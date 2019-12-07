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
            const depsPathsToMultipleVersionPackages = jora(`
                $multiVersionPackages:
                    ..(dependencies.mapToArray("name"))
                    .group(<name>, <version>)
                    .({ name: key, versions: value.sort() })
                    .[versions.size() > 1];

                $pathToMultiVersionPackages: => .($name; {
                    name,
                    version,
                    otherVersions: $multiVersionPackages.pick(<name=$name>).versions - version,
                    dependencies: dependencies
                        .mapToArray("name")
                        .map($pathToMultiVersionPackages)
                        .[name in $multiVersionPackages.name or dependencies]
                });

                map($pathToMultiVersionPackages)
            `)(tree);

            printTree(depsPathsToMultipleVersionPackages);
        } catch (e) {
            console.error('Error: ', e);
        }
    });
