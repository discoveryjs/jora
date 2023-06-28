import assert from 'assert';
import { MinHeap, MaxHeap } from '../../src/utils/heap.js';

describe('utils/heap', () => {
    describe('MinHeap', () => {
        it('should create an empty MinHeap', () => {
            const heap = new MinHeap();
            assert.strictEqual(heap.values.length, 0);
        });

        it('should add elements and maintain max-heap property', () => {
            const heap = new MinHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            assert.strictEqual(heap.values.length, 5);
            assert.strictEqual(heap.values[0], 10);
        });

        it('should respect maxSize when adding elements', () => {
            const heap = new MinHeap(3);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            assert.strictEqual(heap.values.length, 3);
            assert.strictEqual(heap.values[0], 5);
        });

        it('should respect maxSize when adding elements', () => {
            const heap = new MinHeap(3);
            [5, 3, 8, 2, 10, 7, 1, 9, 4, 11].forEach(heap.add, heap);
            assert.strictEqual(heap.values.length, 3);
            assert.strictEqual(heap.values[0], 3);
        });

        it('should extract elements in decreasing order', () => {
            const heap = new MinHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            const extractedValues = [];
            while (heap.values.length > 0) {
                extractedValues.push(heap.extract());
            }
            assert.deepStrictEqual(extractedValues, [10, 8, 5, 3, 2]);
        });

        it('should provide iterator for sorted values', () => {
            const heap = new MinHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            const sortedValues = [...heap];
            assert.deepStrictEqual(sortedValues, [2, 3, 5, 8, 10]);
        });
    });

    describe('MaxHeap', () => {
        it('should create an empty MaxHeap', () => {
            const heap = new MaxHeap();
            assert.strictEqual(heap.values.length, 0);
        });

        it('should add elements and maintain max-heap property', () => {
            const heap = new MaxHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            assert.strictEqual(heap.values.length, 5);
            assert.strictEqual(heap.values[0], 2);
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
            assert.strictEqual(heap.values[0], 9);
        });

        it('should extract elements in decreasing order', () => {
            const heap = new MaxHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            const extractedValues = [];
            while (heap.values.length > 0) {
                extractedValues.push(heap.extract());
            }
            assert.deepStrictEqual(extractedValues, [2, 3, 5, 8, 10]);
        });

        it('should provide iterator for sorted values', () => {
            const heap = new MaxHeap(5);
            [5, 3, 8, 2, 10].forEach(heap.add, heap);
            const sortedValues = [...heap];
            assert.deepStrictEqual(sortedValues, [10, 8, 5, 3, 2]);
        });
    });
});
