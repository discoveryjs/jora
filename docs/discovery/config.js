module.exports = {
    name: 'Jora docs',
    data: './data.js',
    prepare: './prepare.js',
    view: {
        noscript: './noscript.js',
        assets: [
            './common.css',
            './pages/default.css',
            './pages/default.js',
            './pages/article.js',
            './pages/article.css',
            './pages/playground.js',
            './views/playground.js',
            './views/playground.css',
            './sidebar.js',
            './sidebar.css'
        ]
    }
};
