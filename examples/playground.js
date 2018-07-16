const jora = require('./src');
const q = jora('.group(<type>).({ key, count: value.size() }).sort(<count>)', { foo: function() { console.log(arguments) } }, true);

// data -> model
// subject
// ---
// current = data

const allDataMap = {};
const data = [
    {
        type: 'css',
        filename: '1.css',
        x: [],
        refs: [
            {
                type: 'svg',
                expr: '3.svg',
                a: 1
            }
        ]
    },
    {
        type: 'js',
        filename: '2.js',
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
                expr: '2.js'
            }
        ]
    }
];

data.forEach(init);
data.forEach(link);
console.log(data[0]);

console.log('====== Result');
console.log(q(data, data[1]));


// all::count(type="class")


// x > 5

// *.forE

// x[type="asd"].s > 5

// :filter(...):filter()

// __cmp(__root.x.filter(x => x.type === 'asd'), 5, )

// __root.x.filter(x => x.type === 'asd')



// ### 
// . – context subject
// @ – data root


// all = [...]
// all.types
// all.asd
// query(all, subject)

function link(owner) {
    owner.refs.forEach(ref => {
        const refObject = allDataMap[ref.type + ':' + ref.expr];

        if (refObject) {
            ref.resolved = refObject.id;
            owner.deps[refObject.id] = 
                (owner.deps[refObject.id] || []).concat({
                    type: refObject.type,
                    ref,
                    resolved: refObject
                });
            refObject.dependants[owner.id] =
                (refObject.dependants[owner.id] || []).concat({
                    type: owner.type,
                    ref,
                    resolved: owner
                });
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
    e.deps = {};
    e.dependants = {};
    e.errors = [];
    allDataMap[e.type + ':' + e.filename] = e;
}
