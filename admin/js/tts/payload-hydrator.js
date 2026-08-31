/**
 * TTS-290: shared payload hydration for the front-end player bundles.
 *
 * The per-post payload ships as an inert <script type="application/json"
 * class="atlasvoice-payload"> node and is normally lifted into window.TTS by
 * the PHP-emitted inline hydrator (wp_add_inline_script '...-js-before').
 * That hydrator is a JS <script>, so optimizers with a "delay JavaScript
 * execution" mode (WP Rocket rewrites it to type="rocketlazyloadscript") can
 * hold it back while the player bundle — which sites exclude by filename —
 * runs immediately. The JSON node is not JS and is never delayed, so reading
 * it here makes script order irrelevant.
 *
 * Mirrors the PHP hydrator exactly, including the data-atlasvoice-hydrated
 * marker, so a hydrator that runs later finds nothing to do. Hydration is
 * idempotent and can never double-apply.
 *
 * @return {void}
 */
export function hydrateAtlasVoicePayloads() {
    // The PHP hydrator is the single source of truth when it has already run.
    if (window.AtlasVoicePayload && typeof window.AtlasVoicePayload.hydrate === 'function') {
        window.AtlasVoicePayload.hydrate();
        return;
    }

    const nodes = document.querySelectorAll(
        'script.atlasvoice-payload:not([data-atlasvoice-hydrated])'
    );

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let data;

        try {
            data = JSON.parse(node.textContent);
        } catch (e) {
            continue;
        }

        node.setAttribute('data-atlasvoice-hydrated', '1');

        if (window.ttsObj && window.ttsObj.settings) {
            window.ttsObj.settings.settings = data.settings;
        }
        if (!window.TTS) { window.TTS = {}; }
        if (!window.TTS.contents) { window.TTS.contents = {}; }
        if (!window.TTS.extra) { window.TTS.extra = {}; }
        if (!window.TTS.buttons) { window.TTS.buttons = {}; }

        window.TTS.contents[data.playerNo] = data.content;
        window.TTS.extra[data.playerNo]    = data.extra;
        window.TTS.extra.player_id         = data.playerId;
        window.TTS.buttons[data.playerNo]  = { textArr: data.textArr };

        if (!window.TTS.hasOwnProperty('settings')) {
            window.TTS.settings = {
                listening:            data.listening,
                cssClass:             data.cssClass,
                btnStyle:             data.btnStyle,
                textArr:              data.textArr,
                customCSS:            data.customCSS,
                shouldDisplayIcon:    data.shouldDisplayIcon,
                readingTime:          data.readingTime,
                postId:               data.postId,
                fileURLs:             data.fileURLs,
                get_content_from_dom: data.get_content_from_dom,
                speech:               data.speech,
                use_old_player:       data.use_old_player
            };
        }
    }
}
