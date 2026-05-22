const newlineRx = /\n|\r\n?|\u2028|\u2029/g;

export function showPosition(input, offset) {
    const span = 32;
    const start = Math.max(offset - span, 0);
    const end = Math.min(offset + span, input.length);
    const pre = (start === 0 ? '' : '...') + input.slice(start, offset).replace(newlineRx, '\\n');
    const post = input.slice(offset, end).replace(newlineRx, '\\n') + (end === input.length ? '' : '...');

    return `${pre}${post}\n${'-'.repeat(pre.length)}^`;
}

export function offsetToLoc(input, offset) {
    const lines = input.slice(0, offset).split(newlineRx);
    return {
        line: lines.length,
        column: lines[lines.length - 1].length,
        offset
    };
}
