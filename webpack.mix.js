const mix = require('laravel-mix');
// const path = require('path')
// const webpack = require('webpack')
mix.js('src/dashboard/index.js', 'admin/js/wp-speech-dashboard.js').react();

mix.webpackConfig({
 
});