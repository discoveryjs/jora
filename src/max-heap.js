const defaultCompare = (a, b) => a - b;

export class MaxHeap {
    constructor(maxSize, compare, accept) {
        this.maxSize = maxSize || Infinity;
        this.compare = compare || defaultCompare;
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

    extract() {
        const maxValue = this.values[0];
        const lastValue = this.values.pop();

        if (this.values.length > 0) {
            this.values[0] = lastValue;
            this.heapifyDown();
        }

        return maxValue;
    }

    heapifyUp(idx) {
        const values = this.values;
        // let idx = values.length - 1;
        let idxValue = values[idx];

        while (idx > 0) {
            const parentIdx = (idx - 1) >> 1;
            const parentValue = values[parentIdx];

            if (this.compare(parentValue, idxValue) >= 0) {
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

            if (this.compare(leftValue, idxValue) > 0) {
                largestIdx = left;
                largestValue = leftValue;
            }

            // if the right child exists, select the maximum from right node and current largest node
            const right = 2 * idx + 2;

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
            idxValue = largestValue;
        }
    }

    [Symbol.iterator]() {
        return this.values.slice().sort(this.compare)[Symbol.iterator]();
    }
}

// const h = new MaxHeap(6);
// [1, 12, 2, 21, 3, 33, 8, 7, 10, 6, 52, 99, 44].forEach(v=>h.add(v));
// console.log(h.values); // [ 8, 7, 2, 6, 3, 1 ]
// console.log([...h]); // [ 1, 2, 3, 6, 7, 8 ]
