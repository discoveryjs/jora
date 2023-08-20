import { MaxHeap, MinHeap } from './heap.js';
import { processNumericArray } from './process-numeric-array.js';

export function numbersPercentile(array, k, compare) {
    if (array.length === 0 || !isFinite(k) || k < 0 || k > 100) {
        return undefined;
    }

    const rank = k * (array.length - 1) / 100; // Apply a devision by 100 last to reduce a numerical error
    const lowerRank = Math.floor(rank);
    const upperRank = Math.ceil(rank);
    const heap = k < 50
        ? new MinHeap(upperRank + 1, compare)
        : new MaxHeap(array.length - lowerRank, compare); // (array.length - 1) - (lowerRank - 1)

    // heap.values = array.slice(0, heap.maxSize);
    // for (let i = 1; i < heap.maxSize; i++) {
    //     heap.heapifyUp(i);
    // }

    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        if (Number.isNaN(element)) {
            return NaN;
        }

        heap.add(element);
    }

    if (lowerRank !== upperRank) {
        const a = heap.extract();
        const b = heap.values[0];

        // Given that both MinHeap and MaxHeap are utilized, the order of values could be either
        // ascending or descending. The following expression consistently uses the smaller value
        // as the base for the result. This approach helps to minimize numerical error.
        return a <= b
            ? a + (b - a) * (rank - lowerRank)
            : b + (a - b) * (rank - lowerRank);
    }

    return heap.values[0];
}

export function numbersMedian(array, compare) {
    return percentile(array, 50, compare);
}

export function percentile(array, k, getter, formula, compare) {
    if (array.length === 0 || !isFinite(k) || k < 0 || k > 100) {
        return undefined;
    }

    let arrayLength = 0;
    let rank = k * (array.length - 1) / 100; // Apply a devision by 100 last to reduce a numerical error
    let lowerRank = Math.floor(rank);
    let upperRank = Math.ceil(rank);
    let hasNaNs = false;
    const heap = k < 50
        ? new MinHeap(upperRank + 1, compare)
        : new MaxHeap(array.length - lowerRank, compare); // (array.length - 1) - (lowerRank - 1)

    processNumericArray(array, getter, value => {
        if (Number.isNaN(value)) {
            hasNaNs = true;
        }

        heap.add(value);
        arrayLength++;
    });

    if (hasNaNs) {
        return NaN;
    }

    // Adjust heap size and ranks when not all the values were accepted
    if (array.length !== arrayLength) {
        if (arrayLength === 0) {
            return;
        }

        rank = k * (arrayLength - 1) / 100; // Apply a devision by 100 last to reduce a numerical error
        lowerRank = Math.floor(rank);
        upperRank = Math.ceil(rank);

        const maxSize = k < 50
            ? upperRank + 1
            : arrayLength - lowerRank;

        for (let i = heap.values.length; i > maxSize; i--) {
            heap.extract();
        }
    }

    if (lowerRank !== upperRank) {
        const a = heap.extract();
        const b = heap.values[0];

        // Given that both MinHeap and MaxHeap are utilized, the order of values could be either
        // ascending or descending. The following expression consistently uses the smaller value
        // as the base for the result. This approach helps to minimize numerical error.
        return a <= b
            ? a + (b - a) * (rank - lowerRank)
            : b + (a - b) * (rank - lowerRank);
    }

    return heap.values[0];
}

export function median(array, getter, formula) {
    return percentile(array, 50, getter, formula);
}

// console.log(percentile([1, 9, 4, 3, 2, 5, 6, 7, 8, 0, 10], 99.5));
