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
    it('default', () => {
        assert.deepEqual(
            query('[6:]')('hello world'),
            'world'
        );

        assert.deepEqual(
            query('[1:3]')({ 0: 'a', 1: 'b', 2: 'c', 3: 'd', length: 4 }),
            ['b', 'c']
        );

        assert.deepEqual(
            query('[:3:1]')(['a', 'b', 'c', 'd']),
            ['a', 'b', 'c']
        );

        assert.deepEqual(
            query('[1::1]')(['a', 'b', 'c', 'd']),
            ['b', 'c', 'd']
        );

        assert.deepEqual(
            query('[1:]')(['a', 'b', 'c', 'd']),
            ['b', 'c', 'd']
        );

        assert.deepEqual(
            query('[:3]')(['a', 'b', 'c', 'd']),
            ['a', 'b', 'c']
        );

        assert.deepEqual(
            query('[1::2]')(['a', 'b', 'c', 'd']),
            ['b', 'd']
        );

        assert.deepEqual(
            query('[:3:2]')(['a', 'b', 'c', 'd']),
            ['a', 'c']
        );

        assert.deepEqual(
            query('[:]')(['a', 'b', 'c', 'd']),
            ['a', 'b', 'c', 'd']
        );
    });

    it('negative indices', () => {
        assert.deepEqual(
            query('[-2:]')(['a', 'b', 'c', 'd']),
            ['c', 'd']
        );

        assert.deepEqual(
            query('[-10:]')(['a', 'b', 'c', 'd']),
            ['a', 'b', 'c', 'd']
        );

        assert.deepEqual(
            query('[:-2]')(['a', 'b', 'c', 'd']),
            ['a', 'b']
        );

        assert.deepEqual(
            query('[:-10]')(['a', 'b', 'c', 'd']),
            []
        );

        assert.deepEqual(
            query('[::-1]')(['a', 'b', 'c', 'd']),
            ['d', 'c', 'b', 'a']
        );
    });

    it('out of bounds indices', () => {
        assert.deepEqual(
            query('[100:]')(['a', 'b', 'c', 'd']),
            []
        );

        assert.deepEqual(
            query('[:100]')(['a', 'b', 'c', 'd']),
            ['a', 'b', 'c', 'd']
        );
    });
});
