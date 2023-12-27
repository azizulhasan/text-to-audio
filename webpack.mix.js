const mix = require('laravel-mix');


mix.js('src/dashboard/index.js', 'admin/js/build/text-to-audio-dashboard-ui.min.js').react();

/**
 * Demos Assets
 */
mix.js('admin/demos/player3/js/plyr-demo.js', 'admin/demos/player3/js/build/plyr-demo.min.js');
mix.js('admin/demos/player2/js/TextToSpeechProDemo.js', 'admin/demos/player2/js/TextToSpeechProDemo.min.js');


mix.js('src/dashboard/button.js', 'admin/js/build/text-to-audio-pro-button.min.js').react();


mix.js('admin/js/TextToSpeech.js', 'admin/js/build/TextToSpeech.min.js');

mix.js('admin/js/text-to-audio-button.js', 'admin/js/build/text-to-audio-button.min.js');



mix.webpackConfig({});
