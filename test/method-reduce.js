const assert = require('assert');
const query = require('./helpers/lib');

describe('reduce()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('reduce(=>$$+$)')([1, 2, 3]),
            6
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
});
