module.exports = {
    name: 'Jora docs',
    data: './data.js',
    prepare: './prepare.js',
    viewport: 'width=device-width, initial-scale=1',
    view: {
        noscript: './noscript.js',
        assets: [
            './common.css',
            './pages/default.css',
            './pages/default.js',
            './pages/article.js',
            './pages/article.css',
            './pages/playground.js',
            './views/example.js',
            './views/playground.js',
            './views/playground.css',
            './views/sidebar.js',
            './views/sidebar.css'
        ]
    }
};
