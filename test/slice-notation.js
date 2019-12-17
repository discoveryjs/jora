const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

// https://github.com/tc39/proposal-slice-notation/blob/master/README.md

describe('slice | [from:to]', () => {
    it('should be a data root', () => {
        assert.deepEqual(
            query('[0:3]')(data),
            data.slice(0, 3)
        );
    });

    it('should be a subquery', () => {
        assert.deepEqual(
            query('filename[0:3]')(data),
            data.map(i => i.filename).slice(0, 3)
        );
    });

    it('top 3 items from root', () => {
        assert.deepEqual(
            query('[:3]')(data),
            data.slice(0, 3)
        );
    });

    it('top 3 items from subquery', () => {
        assert.deepEqual(
            query('filename[:3]')(data),
            data.map(i => i.filename).slice(0, 3)
        );
    });


    it('from third item from root', () => {
        assert.deepEqual(
            query('[2:]')(data),
            data.slice(2)
        );
    });

    it('from third item from subquery', () => {
        assert.deepEqual(
            query('filename[2:]')(data),
            data.map(i => i.filename).slice(2)
        );
    });

    it('just slice from root', () => {
        assert.deepEqual(
            query('[:]')(data),
            data.slice()
        );
    });

    it('just slice from subquery', () => {
        assert.deepEqual(
            query('filename[:]')(data),
            data.map(i => i.filename).slice()
        );
    });
});

describe('[from:to:step]', () => {
    it('should be a data root', () => {
        const fixture = data.slice(0, 3);

        assert.deepEqual(
            query('[0:3:2]')(data),
            [fixture[0], fixture[2]]
        );
    });

    it('should be a subquery', () => {
        const fixture = data.slice(0, 3).map(i => i.filename);

        assert.deepEqual(
            query('filename[0:3:2]')(data),
            [fixture[0], fixture[2]]
        );
    });

    it('nagative from/to from root', () => {
        const fixture = data.slice(-4, -1);

        assert.deepEqual(
            query('[-4:-1:2]')(data),
            [fixture[0], fixture[2]]
        );
    });

    it('nagative from/to from subquery', () => {
        const fixture = data.slice(-4, -1).map(i => i.filename);

        assert.deepEqual(
            query('filename[-4:-1:2]')(data),
            [fixture[0], fixture[2]]
        );
    });

    it('reverse from root', () => {
        const fixture = data.slice(0, 3);

        assert.deepEqual(
            query('[0:3:-1]')(data),
            [fixture[2], fixture[1], fixture[0]]
        );
    });

    it('reverse from subquery', () => {
        const fixture = data.slice(0, 3).map(i => i.filename);

        assert.deepEqual(
            query('filename[0:3:-1]')(data),
            [fixture[2], fixture[1], fixture[0]]
        );
    });

    it('reverse with nagative from/to from root', () => {
        const fixture = data.slice(-4, -1);

        assert.deepEqual(
            query('[-4:-1:-2]')(data),
            [fixture[2], fixture[0]]
        );
    });

    it('reverse with nagative from/to from subquery', () => {
        const fixture = data.slice(-4, -1).map(i => i.filename);

        assert.deepEqual(
            query('filename[-4:-1:-2]')(data),
            [fixture[2], fixture[0]]
        );
    });

    it('negative from root', () => {
        const fixture = data.slice(0, 3);

        assert.deepEqual(
            query('[0:3:-2]')(data),
            [fixture[2], fixture[0]]
        );
    });

    it('negative from subquery', () => {
        const fixture = data.slice(0, 3).map(i => i.filename);

        assert.deepEqual(
            query('filename[0:3:-2]')(data),
            [fixture[2], fixture[0]]
        );
    });

    it('pass from/to args from root', () => {
        const fixture = data.slice();

        assert.deepEqual(
            query('[::-2]')(data),
            [fixture[6], fixture[4], fixture[2], fixture[0]]
        );
    });

    it('pass from/to args from query', () => {
        const fixture = data.map(i => i.filename);

        assert.deepEqual(
            query('filename[::-2]')(data),
            [fixture[6], fixture[4], fixture[2], fixture[0]]
        );
    });

    it('pass all args from root', () => {
        assert.deepEqual(
            query('[::]')(data),
            data.slice()
        );
    });

    it('pass all args from query', () => {
        assert.deepEqual(
            query('filename[::]')(data),
            data.map(i => i.filename)
        );
    });
});

describe('spec examples', () => {
    it('apply to string', () => {
        assert.deepEqual(
            query('[6:]')('hello world'),
            'world'
        );
    });

    it('apply to an object with length property', () => {
        assert.deepEqual(
            query('[1:3]')({ 0: 'a', 1: 'b', 2: 'c', 3: 'd', length: 4 }),
            ['b', 'c']
        );
    });

    const data = ['a', 'b', 'c', 'd'];
    const tests = {
        'default': {
            '[1:]': ['b', 'c', 'd'],
            '[1:3]': ['b', 'c'],
            '[:3:1]': ['a', 'b', 'c'],
            '[1::1]': ['b', 'c', 'd'],
            '[1:]': ['b', 'c', 'd'],
            '[:3]': ['a', 'b', 'c'],
            '[1::2]': ['b', 'd'],
            '[:3:2]': ['a', 'c'],
            '[:]': ['a', 'b', 'c', 'd']
        },
        'negative indices': {
            '[-2:]': ['c', 'd'],
            '[-10:]': ['a', 'b', 'c', 'd'],
            '[:-2]': ['a', 'b'],
            '[:-10]': [],
            '[::-1]': ['d', 'c', 'b', 'a']
        },
        'out of bounds indices': {
            '[100:]': [],
            '[:100]': ['a', 'b', 'c', 'd']
        }
    };

    for (const section in tests) {
        describe(section, () => {
            for (const testcase in tests[section]) {
                const expected = tests[section][testcase];

                it(testcase, () => {
                    assert.deepEqual(
                        query(testcase)(data),
                        expected
                    );
                });
            }
        });
    }
});
