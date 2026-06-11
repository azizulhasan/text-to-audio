/**
 * TTS-249 (I3): deactivation "rescue" modal behaviour on plugins.php. Moved out
 * of an inline <script> (admin_footer) into this enqueued file. No dynamic PHP
 * values — the modal markup is rendered server-side; this only wires the
 * intercept/close behaviour.
 */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var pluginRow = document.querySelector('tr[data-plugin="text-to-audio/text-to-audio.php"]');
        if (!pluginRow) return;

        var deactivateLink = pluginRow.querySelector('.deactivate a');
        if (!deactivateLink) return;

        var overlay = document.getElementById('tta-rescue-modal-overlay');
        var continueBtn = document.getElementById('tta-rescue-continue-deactivate');
        if (!overlay || !continueBtn) return;

        var rescueShown = false;

        function rescueHandler(e) {
            if (rescueShown) return; // Already shown once, let the click proceed normally.
            e.preventDefault();
            e.stopImmediatePropagation();
            overlay.style.display = 'flex';
        }

        deactivateLink.addEventListener('click', rescueHandler, true);

        // Close modal when clicking the overlay background.
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });

        // Close on Escape key.
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.style.display === 'flex') {
                overlay.style.display = 'none';
            }
        });

        // "Continue to Deactivate" — hide rescue modal and re-click the link to proceed.
        continueBtn.addEventListener('click', function () {
            overlay.style.display = 'none';
            rescueShown = true;
            deactivateLink.removeEventListener('click', rescueHandler, true);
            deactivateLink.click();
        });
    });
})();
