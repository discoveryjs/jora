const assert = require('assert');
const query = require('./helpers/lib');

function generateTests(data, tests) {
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
}

describe('lang/slice notation', () => {
    // special cases
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

    it('apply to non-length value', () => {
        assert.deepEqual(
            query('[6:]')(123),
            []
        );
    });

    it('apply to string', () => {
        assert.deepEqual(
            query('[6::]')('hello world'),
            'world'
        );
    });

    it('apply to an object with length property', () => {
        assert.deepEqual(
            query('[1:3:]')({ 0: 'a', 1: 'b', 2: 'c', 3: 'd', length: 4 }),
            ['b', 'c']
        );
    });

    it('apply to non-length value', () => {
        assert.deepEqual(
            query('[6::]')(123),
            []
        );
    });

    describe('[from:to]', () => {
        const data = [
            { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
            { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' }
        ];
        const ids = data.map(i => i.id);

        generateTests(data, {
            'root': {
                '[0:3]': data.slice(0, 3),
                '[:3]': data.slice(0, 3),
                '[2:]': data.slice(2),
                '[:]': data,
                '[10:20]': [],
                '[-10:-20]': []
            },
            'subquery': {
                'id[0:3]': ids.slice(0, 3),
                'id[:3]': ids.slice(0, 3),
                'id[2:]': ids.slice(2),
                'id[:]': ids.slice(),
                'id[10:20]': [],
                'id[-10:-20]': []
            }
        });
    });

    describe('[from:to:step]', () => {
        const data = [
            { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
            { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' }
        ];
        const ids = data.map(i => i.id);

        generateTests(data, {
            'root': {
                '[0:3:2]': [data[0], data[2]],
                '[0:3:-1]': [data[2], data[1], data[0]],
                '[0:3:0]': [data[0], data[1], data[2]],
                '[-4:-1:2]': [data[4], data[6]],
                '[-4:-1:-2]': [data[6], data[4]],
                '[-10:4:1]': [data[0], data[1], data[2], data[3]],
                '[-10:3:2]': [data[0], data[2]],
                '[-10:3:-2]': [data[2], data[0]],
                '[0:3:-2]': [data[2], data[0]],
                '[::-2]': [data[7], data[5], data[3], data[1]],
                '[::-3]': [data[7], data[4], data[1]],
                '[::]': data
            },
            'subquery': {
                'id[0:3:2]': [ids[0], ids[2]],
                'id[0:3:-1]': [ids[2], ids[1], ids[0]],
                'id[0:3:0]': [ids[0], ids[1], ids[2]],
                'id[-4:-1:2]': [ids[4], ids[6]],
                'id[-4:-1:-2]': [ids[6], ids[4]],
                'id[-10:4:1]': [ids[0], ids[1], ids[2], ids[3]],
                'id[-10:3:2]': [ids[0], ids[2]],
                'id[-10:3:-2]': [ids[2], ids[0]],
                'id[0:3:-2]': [ids[2], ids[0]],
                'id[::-2]': [ids[7], ids[5], ids[3], ids[1]],
                'id[::-3]': [ids[7], ids[4], ids[1]],
                'id[::]': ids
            }
        });
    });

    // Slice notation spec: https://github.com/tc39/proposal-slice-notation/blob/master/README.md
    describe('spec examples', () => {
        const data = ['a', 'b', 'c', 'd'];
        generateTests(data, {
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
        });
    });
});
