const mix = require('laravel-mix');


mix.js('src/dashboard/index.js', 'admin/js/build/text-to-audio-dashboard-ui.min.js').react();
mix.js('src/dashboard/welcome.js', 'admin/js/build/tts-welcome-wizard.min.js').react();

// TTS-249 (T2): the frontend pro-button (players 2..6) moved to the Pro plugin,
// which now builds text-to-audio-pro-button.min.js from its own source. Free no
// longer builds it — no player-2..6 code ships in the free ZIP.
mix.js('src/dashboard/css-selectors.js', 'admin/js/build/tts-css-selectors.min.js').react();
mix.js('src/dashboard/bulk-mp3-file-ui.js', 'admin/js/build/tts-bulk-mp3-file-ui.min.js').react();



mix.js('admin/js/TextToSpeech.js', 'admin/js/build/TextToSpeech.min.js');

mix.js('admin/js/text-to-audio-button.js', 'admin/js/build/text-to-audio-button.min.js');

mix.js('admin/js/AtlasVoiceAnalytics.js', 'admin/js/build/AtlasVoiceAnalytics.min.js');
// TTS-266: player 7. Subclasses window.TextToSpeech at runtime, so this bundle
// stays small and there is only ever one copy of the base class on the page.
mix.js('admin/js/AtlasVoiceCloudPlayer.js', 'admin/js/build/AtlasVoiceCloudPlayer.min.js');
mix.js('admin/js/AtlasVoicePlayerInsights.js', 'admin/js/build/AtlasVoicePlayerInsights.min.js');

// TTS-238: AtlasVoice content extractor engine + visual picker.
mix.js('src/extractor/tts-extractor-engine.js', 'admin/js/build/tts-extractor-engine.min.js');
mix.js('src/picker/tts-picker.js', 'admin/js/build/tts-picker.min.js');



const path = require('path');
const fs = require('fs');

mix.webpackConfig({
    output: {
        // TTS-249: content-hashed chunk filenames so each build produces uniquely
        // named lazy chunks. Without this, the static `tab-*.chunk.js` names never
        // change, so browsers cache them forever and existing users never see new
        // dashboard UI on upgrade (the main bundle's ?ver= cache-buster does NOT
        // propagate to webpack's chunk URLs). The hash changes only when a chunk's
        // content changes, so the main bundle re-fetched on the ?ver bump points at
        // the new chunk name → guaranteed cache-miss → fresh fetch.
        //
        // TTS-253: but ONLY hash in production. In dev/watch every rebuild changes the
        // hash AND the MoveChunksPlugin (below) deletes the old chunk, so an already-
        // open dashboard whose runtime still points at the previous hash throws
        // `ChunkLoadError: Loading chunk failed` when you click a not-yet-loaded tab.
        // Stable dev names are overwritten in place (never deleted), so the open
        // dashboard keeps resolving them. Prod keeps the hash for cache-busting.
        chunkFilename: process.env.NODE_ENV === 'production'
            ? 'chunks/[name].[contenthash].chunk.js'
            : 'chunks/[name].chunk.js',
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
                    } else {
                        // TTS-249: clear stale content-hashed chunks before copying the
                        // fresh build, so old hashes don't accumulate in the folder and
                        // bloat the release ZIP.
                        fs.readdirSync(destDir).forEach(file => {
                            try { fs.unlinkSync(path.join(destDir, file)); } catch (e) { /* ignore */ }
                        });
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
