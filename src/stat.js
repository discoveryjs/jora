const { addToSet, isPlainObject } = require('./utils');
const contextToType = {
    'path': 'property',
    'value': 'value',
    'in-value': 'value',
    'var': 'variable'
};


function valuesToSuggestions(context, values) {
    const suggestions = new Set();
    const addValue = value => {
        switch (typeof value) {
            case 'string':
                suggestions.add(JSON.stringify(value));
                break;
            case 'number':
                suggestions.add(String(value));
                break;
        }
    };

    switch (context) {
        case '':
        case 'path':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (isPlainObject(item)) {
                            addToSet(suggestions, Object.keys(item));
                        }
                    });
                } else if (isPlainObject(value)) {
                    addToSet(suggestions, Object.keys(value));
                }
            });
            break;

        case 'value':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else {
                    addValue(value);
                }
            });
            break;

        case 'in-value':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else if (isPlainObject(value)) {
                    Object.keys(value).forEach(addValue);
                } else {
                    addValue(value);
                }
            });
            break;

        case 'var':
            values.forEach(value => {
                suggestions.add('$' + value);
            });
            break;
    }

    return [...suggestions];
}

function findSourcePosRanges(source, pos, points, includeEmpty) {
    const result = [];

    for (let i = 0; i < points.length; i++) {
        const [values, ranges, context] = points[i];

        for (let j = 0; j < ranges.length; j += 2) {
            let from = ranges[j];
            let to = ranges[j + 1];

            if (pos >= from && pos <= to && (includeEmpty || values.size || values.length)) {
                let current = source.substring(from, to);

                if (!/\S/.test(current)) {
                    current = '';
                    from = to = pos;
                }

                result.push({
                    context,
                    current,
                    from,
                    to,
                    values
                });
            }
        }
    }

    return result;
}

module.exports = (source, points) => ({
    stat(pos, includeEmpty) {
        const ranges = findSourcePosRanges(source, pos, points, includeEmpty);

        ranges.forEach(range => {
            range.values = [...range.values];
        });

        return ranges.length ? ranges : null;
    },
    suggestion(pos, includeEmpty) {
        const ranges = findSourcePosRanges(source, pos, points, includeEmpty);
        const suggestions = [];

        ranges.forEach(range => {
            const { context, current, from, to, values } = range;

            // console.log({current, variants:[...suggestions.get(range)], suggestions })
            suggestions.push(
                ...valuesToSuggestions(context, values)
                    .map(value => ({
                        current,
                        type: contextToType[context],
                        value,
                        from,
                        to
                    }))
            );
        });

        return suggestions.length ? suggestions : null;
    }
});
