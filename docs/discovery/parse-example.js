const jora = require('jora');

exports.parseExample = function(example) {
    const parsed = Object.create(null);
    const store = (prop) => (m, ...x) => {
        const { ref, value } = x.pop();

        if (ref) {
            parsed[prop + 'Ref'] = ref;
            return '';
        }

        try {
            parsed[prop] = jora(`${value.replace(/^\s*\/\//gm, '')}`)();
            return '';
        } catch (e) {
            parsed.hasErrors = true;
            parsed[prop + 'Error'] = e.message;
            return m + restore;
        }
    };
    let restore = '';

    parsed.content = '';
    parsed.content = example
        .replace(/\s*\/\/\s*Result:\s*(?<value>.*)$/is, store('result'))
        .replace(/\s*\/\/\s*Context:\s*(?<value>.*)$/is, store('context'))
        .replace(/\s*\/\/\s*Input(?<ref>\[\d+\])(?::\s*(?<value>.*))?$/is, store('input')) +
        restore;

    return parsed;
};
