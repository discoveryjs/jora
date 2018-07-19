// Plain JavaScript version of npm-ls.js

function printTree(pkg, level = '') {
    console.log(level + pkg.name + '@' + pkg.version + (pkg.otherVersions.length ? ` [other versions: ${pkg.otherVersions.join(', ')}]` : ''));
    level = level.replace('└─ ', '   ').replace('├─ ', '│  ');
    pkg.dependencies.forEach((dep, idx, arr) => printTree(dep, level + (idx === arr.length - 1 ? '└─ ' : '├─ ')));
}

function collectVersions(pkg, map = {}) {
    for (let key in pkg.dependencies) {
        if (!map[key]) {
            map[key] = new Set();
        }

        map[key].add(pkg.dependencies[key].version);

        collectVersions(pkg.dependencies[key], map);
    }

    return map;
}

function processTree(pkg, name, map) {
    const deps = [];
    const pkgName = pkg.name || name;

    for (let key in pkg.dependencies) {
        const dep = processTree(pkg.dependencies[key], key, map);

        if (dep) {
            deps.push(dep);
        }
    }

    if (pkgName in map || deps.length) {
        return {
            name: pkgName,
            version: pkg.version,
            otherVersions: pkgName in map ? map[pkgName].filter(version => version !== pkg.version) : [],
            dependencies: deps
        };
    }

    return false;
}

require('child_process')
    .exec('npm ls --json', {maxBuffer: 1024 * 1024}, (error, stdout) => {
        if (!stdout) {
            return;
        }

        try {
            const tree = JSON.parse(stdout);
            const multipleVersionPackages = collectVersions(tree);

            for (let key in multipleVersionPackages) {
                if (multipleVersionPackages[key].size === 1) {
                    delete multipleVersionPackages[key];
                } else {
                    multipleVersionPackages[key] = [...multipleVersionPackages[key]].sort();
                }
            }

            const depsPathsToMultipleVersionPackages = processTree(tree, null, multipleVersionPackages);

            printTree(depsPathsToMultipleVersionPackages);
        } catch (e) {
            console.error('Error: ', e);
        }
    });
