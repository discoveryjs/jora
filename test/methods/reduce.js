import assert from 'assert';
import query from 'jora';

describe('reduce()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('reduce(=>$$+$)')([1, 2, 3]),
            6
        );
    });

    it('with non-array value', () => {
        assert.deepEqual(
            query('reduce(=>$$+$, 2)')(40),
            42
        );
    });

    it('init value', () => {
        assert.deepEqual(
            query('reduce(=>$$+$, 10)')([1, 2, 3]),
            16
        );
    });

    it('$$ is acc', () => {
        assert.deepEqual(
            query('reduce(=>$$, 10)')([1, 2, 3]),
            10
        );
    });

    it('max', () => {
        assert.deepEqual(
            query('reduce(=>$ > $$ ? $ : $$)')([1, 2, 3, 5, 2]),
            5
        );
    });

    it('max element', () => {
        assert.deepEqual(
            query('reduce(=>value > $$.value ? $ : $$)')([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 5 }, { value: 2 }]),
            { value: 5 }
        );
    });

    it('concat', () => {
        assert.deepEqual(
            // reverse
            query('reduce(=>[$, ...$$])')([1, 2, 3, 5, 2]),
            [2, 5, 3, 2, 1]
        );
    });

    it('should work with TypedArray', () => {
        assert.deepEqual(
            query('reduce(=>$$+$)')(new Uint8Array([3, 2, 1, 4])),
            10
        );
    });
});
