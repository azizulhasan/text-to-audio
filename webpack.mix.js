const mix = require('laravel-mix');
// const path = require('path')
// const webpack = require('webpack')


// mix.js('src/dashboard/index.js', 'admin/js/build/text-to-audio-dashboard-ui.min.js').react();


mix.js('src/dashboard/button.js', 'admin/js/build/text-to-audio-pro-button.min.js').react();


// mix.js('admin/js/TextToSpeech.js', 'admin/js/build/TextToSpeech.min.js');

// mix.js('admin/js/text-to-audio-button.js', 'admin/js/build/text-to-audio-button.min.js');



mix.webpackConfig({});
