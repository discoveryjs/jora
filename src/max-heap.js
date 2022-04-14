const defaultCompare = (a, b) => a - b;
const defaultAccept = () => true;

export class MaxHeap {
    constructor(maxSize, compare, accept) {
        this.maxSize = maxSize || Infinity;
        this.compare = compare || defaultCompare;
        this.accept = accept || defaultAccept;

        this.values = [];
    }

    add(value) {
        const newSize = this.values.length + 1;

        if (newSize > this.maxSize) {
            if (this.compare(this.values[0], value) > 0) {
                if (this.accept(value)) {
                    this.values[0] = value;
                    this.heapify(0);
                }
            }
        } else {
            if (this.accept(value)) {
                this.values.push(value);

                // calling heapify for each nodes when reach max size
                if (newSize === this.maxSize) {
                    for (let i = newSize - 1; i >= 0; i--) {
                        this.heapify(i);
                    }
                }
            }
        }
    }

    heapify(idx) {
        const size = this.values.length;

        // if node doesn't exists, simply return
        if (idx >= (size >> 1)) {
            return;
        }

        // indexes for left and right nodes
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        const idxValue = this.values[idx];

        // select minimum from left node and current node idx
        let smallestIdx = this.compare(this.values[left], idxValue) > 0 ? left : idx;

        // if right child exist, compare and update the smallestIdx variable
        if (right < size && this.compare(this.values[right], this.values[smallestIdx]) > 0) {
            smallestIdx = right;
        }

        // if node idx violates the min-heap property, swap current node idx
        // with smallestIdx to fix the min-heap property and recursively call heapify for smallestIdx
        if (smallestIdx !== idx) {
            // swap
            this.values[idx] = this.values[smallestIdx];
            this.values[smallestIdx] = idxValue;

            // go down
            this.heapify(smallestIdx);
        }
    }

    [Symbol.iterator]() {
        return this.values.slice().sort(this.compare)[Symbol.iterator]();
    }
}

// const h = new MaxHeap(6);
// [1, 12, 2, 21, 3, 33, 8, 7, 10, 6, 52, 99, 44].forEach(v=>h.add(v));
// console.log(h.values);
// console.log([...h]);
