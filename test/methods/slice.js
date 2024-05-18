import assert from 'assert';
import query from 'jora';

describe('slice()', () => {
    describe('array', () => {
        const data = [1, 2, 3, 4, 5, 6, 7];

        it('with no arguments', () =>
            assert.deepEqual(
                query('slice()')(data),
                [1, 2, 3, 4, 5, 6, 7]
            )
        );

        it('with start', () =>
            assert.deepEqual(
                query('slice(1)')(data),
                [2, 3, 4, 5, 6, 7]
            )
        );

        it('with start and end', () =>
            assert.deepEqual(
                query('slice(1, 3)')(data),
                [2, 3]
            )
        );

        it('with start > end', () =>
            assert.deepEqual(
                query('slice(3, 1)')(data),
                []
            )
        );

        it('with negative start', () =>
            assert.deepEqual(
                query('slice(-2)')(data),
                [6, 7]
            )
        );

        it('with negative start and end', () =>
            assert.deepEqual(
                query('slice(-6, -4)')(data),
                [2, 3]
            )
        );

        it('with negative start and end, when start > end', () =>
            assert.deepEqual(
                query('slice(-4, -6)')(data),
                []
            )
        );

        it('no step support', () =>
            assert.deepEqual(
                query('slice(1, 5, 2)')(data),
                [2, 3, 4, 5]
            )
        );
    });

    it('should work with TypedArray', () => {
        assert.deepEqual(
            query('slice(1, 4)')(new Uint8Array([1, 2, 3, 4, 5, 6])),
            new Uint8Array([2, 3, 4])
        );
    });

    describe('string', () => {
        it('with no arguments', () =>
            assert.deepEqual(
                query('slice()')('1.css'),
                '1.css'
            )
        );

        it('with start', () =>
            assert.deepEqual(
                query('slice(1)')('1.css'),
                '.css'
            )
        );

        it('with start and end', () =>
            assert.deepEqual(
                query('slice(1, 3)')('1.css'),
                '.c'
            )
        );

        it('with start > end', () =>
            assert.deepEqual(
                query('slice(3, 1)')('1.css'),
                ''
            )
        );

        it('with negative start', () =>
            assert.deepEqual(
                query('slice(-2)')('hello'),
                'lo'
            )
        );

        it('with negative start and end', () =>
            assert.deepEqual(
                query('slice(-5, -3)')('hello world'),
                'wo'
            )
        );

        it('with negative start and end, when start > end', () =>
            assert.deepEqual(
                query('slice(-3, -5)')('hello world'),
                ''
            )
        );

        it('no step support', () =>
            assert.deepEqual(
                query('slice(1, 4, 2)')('hello'),
                'ell'
            )
        );
    });
});
