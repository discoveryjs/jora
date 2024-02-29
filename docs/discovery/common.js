/* global discovery */

Promise.resolve().then(() =>
    discovery.nav.primary.append({
        className: 'github',
        content: 'text:"GitHub"',
        data: { href: 'https://github.com/discoveryjs/jora' }
    })
);
