const mix = require('laravel-mix');
// const path = require('path')
// const webpack = require('webpack')

mix.js('src/dashboard/index.js', 'admin/js/build/text-to-audio-dashboard-ui.min.js').react();

mix.js('admin/js/text-to-audio-front.js', 'admin/js/build/text-to-audio-front.min.js');


mix.webpackConfig({});
