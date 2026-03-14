/**
 * Set webpack public path for lazy-loaded chunks.
 *
 * This MUST be the first import in the entry point (index.js).
 * WordPress enqueues the main bundle from a dynamic URL, so we
 * derive the public path from the script tag's own src attribute.
 */
/* eslint-disable camelcase, no-undef */
const currentScript = document.currentScript || document.querySelector('script[src*="text-to-audio-dashboard-ui"]');
if (currentScript) {
    const src = currentScript.src;
    // Extract everything up to and including the last '/' before the filename.
    __webpack_public_path__ = src.substring(0, src.lastIndexOf('/') + 1);
}
