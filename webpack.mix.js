const mix = require('laravel-mix');


mix.js('src/dashboard/index.js', 'admin/js/build/text-to-audio-dashboard-ui.min.js').react();
mix.js('src/dashboard/welcome.js', 'admin/js/build/tts-welcome-wizard.min.js').react();

/**
 * Demos Assets
 */
mix.js('admin/demos/player3/js/plyr-demo.js', 'admin/demos/player3/js/build/plyr-demo.min.js');
mix.js('admin/demos/player2/js/TextToSpeechProDemo.js', 'admin/demos/player2/js/TextToSpeechProDemo.min.js');


mix.js('src/dashboard/button.js', 'admin/js/build/text-to-audio-pro-button.min.js').react();
mix.js('src/dashboard/css-selectors.js', 'admin/js/build/tts-css-selectors.min.js').react();
mix.js('src/dashboard/bulk-mp3-file.js', 'admin/js/build/tts-bulk-mp3-file.min.js').react();



mix.js('admin/js/TextToSpeech.js', 'admin/js/build/TextToSpeech.min.js');

mix.js('admin/js/text-to-audio-button.js', 'admin/js/build/text-to-audio-button.min.js');

mix.js('admin/js/AtlasVoiceAnalytics.js', 'admin/js/build/AtlasVoiceAnalytics.min.js');
mix.js('admin/js/AtlasVoicePlayerInsights.js', 'admin/js/build/AtlasVoicePlayerInsights.min.js');



const path = require('path');
const fs = require('fs');

mix.webpackConfig({
    output: {
        chunkFilename: 'chunks/[name].chunk.js',
    },
    plugins: [
        {
            apply(compiler) {
                compiler.hooks.afterEmit.tap('MoveChunksPlugin', () => {
                    const srcDir = path.resolve(__dirname, 'chunks');
                    const destDir = path.resolve(__dirname, 'admin/js/build/chunks');
                    if (!fs.existsSync(srcDir)) return;
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.readdirSync(srcDir).forEach(file => {
                        fs.copyFileSync(
                            path.join(srcDir, file),
                            path.join(destDir, file)
                        );
                        fs.unlinkSync(path.join(srcDir, file));
                    });
                    // Remove empty source directory.
                    try { fs.rmdirSync(srcDir); } catch (e) { /* ignore */ }
                });
            },
        },
    ],
});
