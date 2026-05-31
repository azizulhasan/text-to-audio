/**
 * TTS-240/249 (I3): CORS/CDN failure detector. Moved out of an inline <script>
 * on wp_head into this enqueued file. Dynamic values (REST endpoint, site host)
 * arrive via wp_localize_script as `ttaCorsDetector`.
 *
 * A script 'error' event for one of our plugin's scripts from a cross-origin
 * host is strong proof of a CORS/CDN load failure; we beacon the server, which
 * re-validates and rate-limits to 1 alert/hour.
 */
(function () {
    if (typeof ttaCorsDetector === 'undefined') {
        return;
    }
    var endpoint = ttaCorsDetector.endpoint;
    var siteHost = ttaCorsDetector.siteHost;
    var reported = false;

    window.addEventListener('error', function (e) {
        if (reported || !e || !e.target || e.target.tagName !== 'SCRIPT') return;
        var src = e.target.src || '';
        if (!/\/plugins\/text-to-(audio|speech)/.test(src)) return;
        var host = '';
        try { host = new URL(src).host; } catch (_) { return; }
        if (!host || host === siteHost) return;

        reported = true;
        var payload = JSON.stringify({ url: src });
        if (navigator.sendBeacon) {
            var blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(function () {});
        }
    }, true);
})();
