const allDataMap = {};
const data = [
    {
        type: 'css',
        filename: '1.css',
        unique: 'marker',
        '\'\"': 'a key with special chars',
        refs: [
            {
                type: 'svg',
                expr: '3.svg'
            }
        ]
    },
    {
        type: 'js',
        filename: '2.js',
        uniqueNumber: 456,
        refs: [
            {
                type: 'css',
                expr: '12.css'
            }
        ]
    },
    {
        type: 'svg',
        filename: '3.svg',
        refs: []
    },
    {
        type: 'js',
        filename: '4.js',
        refs: [
            {
                type: 'css',
                expr: '1.css'
            }
        ]
    },
    {
        type: 'js',
        filename: '5.js',
        refs: [
            {
                type: 'css',
                expr: '6.css'
            },
            {
                type: 'css',
                expr: '1.css'
            }
        ]
    },
    {
        type: 'css',
        filename: '6.css',
        refs: [
            {
                type: 'js',
                expr: '5.js'
            }
        ]
    },
    {
        type: 'css',
        filename: '7.css',
        refs: [
            {
                type: 'js',
                expr: '15.js'
            },
            {
                type: 'js',
                expr: '5.js'
            }
        ]
    }
];

function link(owner) {
    owner.refs.forEach(ref => {
        const refObject = allDataMap[ref.type + ':' + ref.expr];

        if (refObject) {
            ref.resolved = refObject.id;
            owner.deps.add(refObject);
            refObject.dependants.add(owner);
            // owner.deps[refObject.id] =
            //     (owner.deps[refObject.id] || []).concat({
            //         type: refObject.type,
            //         ref,
            //         resolved: refObject
            //     });
            // refObject.dependants[owner.id] =
            //     (refObject.dependants[owner.id] || []).concat({
            //         type: owner.type,
            //         ref,
            //         resolved: owner
            //     });
        } else {
            ref.broken = true;
            owner.errors.push({
                owner,
                message: `Unresolved reference: ${
                    !ref.expr || ref.expr === ref.resolved
                        ? ref.resolved
                        : `${ref.expr} → ${ref.resolved}`
                }`,
                ref
            });
        }
    });
}

function init(e) {
    e.id = e.type + ':' + e.filename;
    e.deps = new Set();
    e.dependants = new Set();
    e.errors = [];
    allDataMap[e.type + ':' + e.filename] = e;
}

function final(e) {
    e.deps = [...e.deps];
    e.dependants = [...e.dependants];
}

data.forEach(init);
data.forEach(link);
data.forEach(final);
// console.log(data);
// process.exit();

module.exports = data;
