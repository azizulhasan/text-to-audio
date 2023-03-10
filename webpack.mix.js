const mix = require('laravel-mix');
// const path = require('path')
// const webpack = require('webpack')

mix.js('admin/js/text-to-audio.js', 'admin/js/text-to-audio-build.js');
mix.webpackConfig({});
