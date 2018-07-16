const jora = require('../src');

require('child_process')
    .exec('npm ls --json', {maxBuffer: 1024 * 1024}, (error, stdout) => {
        if (!stdout) {
            return;
        }

        try {
            const data = JSON.parse(stdout);
            const dup = jora(`
                ..(
                    dependencies
                        .entries()
                        .({
                            name: key,
                            ...value
                        })
                )
                .group(<name>, <version>)[value.size() > 1]
                .({ name: key, versions: value.sort() })
            `)(data);
            console.log(
                dup
            );
        } catch (e) {
            console.error('Error: ', e);
        }

        // console.log(
        //     jora(`
        //         ..(
        //             dependencies
        //                 .entries()
        //                 .({
        //                     name: key,
        //                     ...value
        //                 })
        //         )
        //         .({
        //             name,
        //             deps: dependencies.keys()[$ in #.name]
        //         })[deps]
        //     `)(data, dup)
        // );
    });
