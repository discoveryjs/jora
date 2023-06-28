const defaultMinCompare = (a, b) => a - b;
const defaultMaxCompare = (a, b) => b - a;

export class Heap {
    constructor(maxSize, compare, accept) {
        this.maxSize = maxSize || Infinity;
        this.compare = compare || defaultMaxCompare;
        this.accept = accept || null;

        this.values = [];
    }

    add(value) {
        if (this.accept !== null && !this.accept(value)) {
            return;
        }

        if (this.values.length < this.maxSize) {
            this.values.push(value);
            this.heapifyUp(this.values.length - 1);
        } else if (this.compare(this.values[0], value) > 0) {
            this.values[0] = value;
            this.heapifyDown();
        }
    }

    addArray(array) {
        for (let i = 0; i < array.length; i++) {
            this.add(array[i]);
        }
    }

    extract() {
        const topValue = this.values[0];
        const lastValue = this.values.pop();

        if (this.values.length > 0) {
            this.values[0] = lastValue;
            this.heapifyDown();
        }

        return topValue;
    }

    heapifyUp(idx) {
        const values = this.values;
        let idxValue = values[idx];

        while (idx > 0) {
            const parentIdx = (idx - 1) >> 1;
            const parentValue = values[parentIdx];

            if (this.compare(parentValue, idxValue) > 0) {
                break;
            }

            // swap
            values[parentIdx] = idxValue;
            values[idx] = parentValue;

            // move up
            idx = parentIdx;
        }
    }

    heapifyDown() {
        const values = this.values;
        const size = values.length;
        const halfSize = size >> 1;
        let idx = 0;
        let idxValue = values[idx];
        let largestIdx = idx;
        let largestValue = idxValue;

        // if node doesn't exist, simply return
        while (idx < halfSize) {
            // select the maximum from left node and current node
            const left = 2 * idx + 1;
            const leftValue = values[left];
            const right = left + 1;

            if (this.compare(leftValue, idxValue) > 0) {
                largestIdx = left;
                largestValue = leftValue;
            }

            // if the right child exists, compare the maximum with right node
            if (right < size) {
                const rightValue = values[right];

                if (this.compare(rightValue, largestValue) > 0) {
                    largestIdx = right;
                    largestValue = rightValue;
                }
            }

            // if node idx does not violate the max-heap property, break the loop
            if (largestIdx === idx) {
                break;
            }

            // swap
            values[idx] = largestValue;
            values[largestIdx] = idxValue;

            // go down
            idx = largestIdx;
            largestValue = idxValue;
        }
    }

    [Symbol.iterator]() {
        return this.values.slice().sort(this.compare)[Symbol.iterator]();
    }
}

export class MaxHeap extends Heap {};
export class MinHeap extends Heap {
    constructor(maxSize, compare, accept) {
        super(
            maxSize,
            compare ? (a, b) => -compare(a, b) : defaultMinCompare,
            accept
        );
    }
};
