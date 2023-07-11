/* global discovery */

discovery.view.define('example', {
    view: 'source',
    data: '$m: content.match(/^(.+?)(?:\\s*\\/\\/\\s*Result:\\s*(.*))?$/is).matched; { ..., content: $m[1], result: $m[2] }',
    actionButtons: {
        view: 'button',
        when: 'syntax = "jora"',
        content: 'text:"Open in playground"',
        data: '{ href: { query: content }.playgroundLink() }'
    },
    // prelude: {
    //     view: 'struct',
    //     when: 'syntax = "jora"'
    // },
    postlude: {
        view: 'struct',
        className: 'view-struct_code-postlude',
        when: 'syntax = "jora" and result != undefined',
        data: 'result.replace(/^\\s*\\/\\//gm, "").result()',
        limitCompactObjectEntries: false
    }
}, { tag: false });
