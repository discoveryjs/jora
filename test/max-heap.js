import assert from 'assert';
import { MaxHeap } from '../src/max-heap.js';

describe('MaxHeap', () => {
    it('should create an empty MaxHeap', () => {
        const heap = new MaxHeap();
        assert.strictEqual(heap.values.length, 0);
    });

    it('should add elements and maintain max-heap property', () => {
        const heap = new MaxHeap(5);
        [5, 3, 8, 2, 10].forEach(heap.add, heap);
        assert.strictEqual(heap.values.length, 5);
        assert.strictEqual(heap.values[0], 10);
    });

    it('should respect maxSize when adding elements', () => {
        const heap = new MaxHeap(3);
        [5, 3, 8, 2, 10].forEach(heap.add, heap);
        assert.strictEqual(heap.values.length, 3);
        assert.strictEqual(heap.values[0], 5);
    });

    it('should respect maxSize when adding elements', () => {
        const heap = new MaxHeap(3);
        [5, 3, 8, 2, 10, 7, 1, 9, 4, 11].forEach(heap.add, heap);
        assert.strictEqual(heap.values.length, 3);
        assert.strictEqual(heap.values[0], 3);
    });

    it('should extract elements in decreasing order', () => {
        const heap = new MaxHeap(5);
        [5, 3, 8, 2, 10].forEach(heap.add, heap);
        const extractedValues = [];
        while (heap.values.length > 0) {
            extractedValues.push(heap.extract());
        }
        assert.deepStrictEqual(extractedValues, [10, 8, 5, 3, 2]);
    });

    it('should provide iterator for sorted values', () => {
        const heap = new MaxHeap(5);
        [5, 3, 8, 2, 10].forEach(heap.add, heap);
        const sortedValues = [...heap];
        assert.deepStrictEqual(sortedValues, [2, 3, 5, 8, 10]);
    });
});
