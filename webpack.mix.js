const mix = require('laravel-mix');
// const path = require('path')
// const webpack = require('webpack')
mix.js('src/dashboard/index.js', 'admin/js/webappick-tracker-react.js').react();

mix.webpackConfig({
    // devServer: {
    //     static: {
    //         directory: path.join(__dirname, __dirname),
    //     },
    //     compress: false,
    //     port: 9000,
    // },
    // plugins: [
    //     new webpack.DefinePlugin({
    //         __VUE_OPTIONS_API__: true,
    //         __VUE_PROD_DEVTOOLS__: false,
    //     }),
    // ],
    resolve: {
        fallback: {
            "fs": false,
    "tls": false,
    "net": false,
    "path": false,
    "zlib": false,
    "constants": false,
    "os": false,
    "vm": false,
    "crypto": false,
    "stream":false,
    "https": false,
    "http": false,
    
        } 
    }
});