/**
 * TTS-249 (I3): AtlasVoice admin-bar toggle behaviour (front-end, logged-in
 * admins). Moved out of an inline <script> on wp_footer into this enqueued
 * file. Dynamic values (post id, ajax url, nonce, labels) arrive via
 * wp_localize_script as `ttaAdminBar`.
 */
(function () {
    if (typeof ttaAdminBar === 'undefined') {
        return;
    }

    var node = document.getElementById('wp-admin-bar-tta-audio-toggle');
    if (!node) return;

    var link = node.querySelector('a.ab-item');
    if (!link) return;

    link.addEventListener('click', function (e) {
        e.preventDefault();

        var data = new FormData();
        data.append('action', 'tta_toggle_audio');
        data.append('post_id', ttaAdminBar.postId);
        data.append('_ajax_nonce', ttaAdminBar.nonce);

        fetch(ttaAdminBar.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data
        })
            .then(function (r) { return r.json(); })
            .then(function (resp) {
                if (!resp.success) return;

                var indicator = node.querySelector('.tta-ab-indicator');
                var textNode = link.lastChild;

                if (resp.data.is_active) {
                    indicator.className = 'tta-ab-indicator tta-ab-on';
                    textNode.textContent = ' ' + ttaAdminBar.onLabel;
                } else {
                    indicator.className = 'tta-ab-indicator tta-ab-off';
                    textNode.textContent = ' ' + ttaAdminBar.offLabel;
                }
            });
    });
})();
