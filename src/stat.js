import buildin from './lang/compile-buildin.js';
import { MaxHeap } from './utils/heap.js';
import { isPlainObject } from './utils/misc.js';

const contextToType = {
    'path': 'property',
    'key': 'value',
    'value': 'value',
    'in-value': 'value',
    'value-subset': 'value',
    'var': 'variable',
    'assertion': 'assertion'
};

function addObjectKeysToSet(object, set) {
    Object.keys(object).forEach(set.add, set);
}

function valuesToSuggestions(context, values, related, suggestions = new Set()) {
    const addValue = value => {
        switch (typeof value) {
            case 'string':
            case 'number':
                suggestions.add(value);
                break;
        }
    };

    switch (context) {
        case 'path': {
            // use keys set to prevent duplications
            const keys = new Set();

            for (const value of values) {
                if (Array.isArray(value)) {
                    for (const item of value) {
                        if (isPlainObject(item)) {
                            addObjectKeysToSet(item, keys);
                        }
                    }
                } else if (isPlainObject(value)) {
                    addObjectKeysToSet(value, keys);
                }
            }

            keys.forEach(suggestions.add, suggestions);

            break;
        }

        case 'key': {
            // use keys set to prevent duplications
            const keys = new Set();

            for (const value of values) {
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    addObjectKeysToSet(value, keys);
                }
            }

            keys.forEach(suggestions.add, suggestions);

            break;
        }

        case 'value':
            for (const value of values) {
                addValue(value);
            }
            break;

        case 'in-value': {
            // use keys set to prevent duplications
            const keys = new Set();

            for (const value of values) {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else if (isPlainObject(value)) {
                    addObjectKeysToSet(value, keys);
                }
            }

            keys.forEach(suggestions.add, suggestions);

            break;
        }

        case 'var':
            for (const value of values) {
                suggestions.add('$' + value);
            }
            break;

        case 'value-subset': {
            const ignoreValues = new Set(related);

            for (const value of values) {
                if (!ignoreValues.has(value)) {
                    addValue(value);
                }
            }

            break;
        }
    }

    return suggestions;
}

function findSourcePosRanges(source, pos, points, includeEmpty = false) {
    const ranges = [];

    for (let [from, to, context, values, related = null] of points) {
        if (pos >= from && pos <= to && (includeEmpty || values.size || values.length)) {
            let text = source.substring(from, to);

            if (!/\S/.test(text)) {
                from = to = pos;
                text = '';
            }

            ranges.push({
                context,
                from,
                to,
                text,
                values,
                related
            });
        }
    }

    return ranges;
}

function normalizeFunctionOption(value, fn) {
    if (typeof value === 'function') {
        return value;
    }

    if (value === true) {
        return fn;
    }

    return false;
}

function normalizeFilterPattern(value) {
    if (/^(["']).*\1$/.test(value)) {
        try {
            // convert 'string' -> "string"
            // \' -> '
            // "  -> \"
            // \. -> \. (any other escaped char left as is)
            if (value[0] === '\'') {
                value = `"${value.slice(1, -1).replace(
                    /\\.|"/g,
                    m => m === '\\\'' ? '\'' : m === '"' ? '\\\"' : m
                )}"`;
            }

            return JSON.parse(value);
        } catch (e) {}
    }

    return value;
}

function defaultFilterFactory(pattern) {
    // 2022-04-08
    // v8: includes() is 20-30% slower than indexOf() !== -1
    // Firefox & Safari approximate the same
    return value => (typeof value === 'string' ? value : String(value)).toLowerCase().indexOf(pattern) !== -1;
}

export default (source, { value, stats, assertions }) => ({
    get value() {
        return value;
    },
    stat(pos, includeEmpty) {
        return findSourcePosRanges(source, pos, stats, includeEmpty);
    },
    suggestion(pos, options) {
        let { limit = Infinity, sort, filter: filterFactory } = options || {};
        sort = normalizeFunctionOption(sort, buildin.cmp);
        filterFactory = normalizeFunctionOption(filterFactory, defaultFilterFactory);

        const storageType = sort && isFinite(limit) ? MaxHeap : Set;
        const ranges = findSourcePosRanges(source, pos, stats, true);
        const typeSuggestions = new Map();
        const result = [];

        for (const range of ranges) {
            const { context, text, from, to, values, related } = range;
            const type = contextToType[context];

            if (!typeSuggestions.has(type)) {
                let storage;

                switch (storageType) {
                    case MaxHeap:
                        storage = new MaxHeap(
                            limit,
                            sort,
                            filterFactory && filterFactory(normalizeFilterPattern(text))
                        );
                        break;

                    case Set:
                        storage = new Set();
                        break;
                }

                typeSuggestions.set(type, {
                    type,
                    from,
                    to,
                    text,
                    suggestions: storage
                });
            }

            const { suggestions } = typeSuggestions.get(type);

            switch (context) {
                case 'assertion':
                    if (suggestions.size === 0 || (suggestions.values && suggestions.values.length === 0)) {
                        for (const value of Object.keys(assertions)) {
                            suggestions.add(value);
                        }
                    }
                    break;

                default:
                    valuesToSuggestions(context, values, related, suggestions);
            }
        }

        if (storageType === Set) {
            for (const entry of typeSuggestions.values()) {
                let { suggestions } = entry;

                if (sort) {
                    suggestions = [...suggestions].sort(sort);
                }

                if (filterFactory || isFinite(limit)) {
                    const result = [];
                    const accept = filterFactory
                        ? filterFactory(normalizeFilterPattern(entry.text))
                        : () => true;

                    for (const value of suggestions) {
                        if (accept(value) && result.push(value) >= limit) {
                            break;
                        }
                    }

                    suggestions = result;
                }

                entry.suggestions = suggestions;
            }
        }

        for (const entry of typeSuggestions.values()) {
            entry.suggestions = Array.isArray(entry.suggestions)
                ? entry.suggestions
                : [...entry.suggestions];

            if (entry.suggestions.length) {
                result.push(entry);
            }
        }

        return result.length ? result : null;
    }
});
