const { addToSet, isPlainObject } = require('./utils');
const contextToType = {
    'path': 'property',
    'key': 'value',
    'value': 'value',
    'in-value': 'value',
    'value-subset': 'value',
    'var': 'variable'
};


function valuesToSuggestions(context, values, related) {
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

        case 'key':
            values.forEach(value => {
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    Object.keys(value).forEach(addValue);
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

        case 'value-subset':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else {
                    addValue(value);
                }
            });

            // delete used
            related.forEach(arr => {
                arr.forEach(value => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        suggestions.delete(JSON.stringify(value));
                    }
                });
            });
            break;
    }

    return [...suggestions];
}

function findSourcePosRanges(source, pos, points, includeEmpty) {
    const result = [];

    for (let [from, to, context, values, related = null] of points) {
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
                values,
                related
            });
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
            const { context, current, from, to, values, related } = range;

            // console.log({current, variants:[...suggestions.get(range)], suggestions })
            suggestions.push(
                ...valuesToSuggestions(context, values, related)
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
