/**
 * The single source of truth for "which locales do we ship?".
 *
 * The list lives in PHP, on TTA_Translation_Downloader::AVAILABLE_LOCALES,
 * because the plugin needs it at runtime to decide which translation packs it
 * may offer to download. Rather than keep a second copy in JS that would drift,
 * every script in this folder reads that constant through here.
 *
 * Adding a locale is therefore a one-line change in the PHP constant.
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const DOMAIN = 'text-to-audio';
const LANG_DIR = path.join(PLUGIN_ROOT, 'languages');
const CONSTANT_FILE = path.join(PLUGIN_ROOT, 'includes', 'TTA_Translation_Downloader.php');

/**
 * @returns {string[]} Locale codes in the order the PHP constant declares them.
 */
function availableLocales() {
    const src = fs.readFileSync(CONSTANT_FILE, 'utf8');
    const block = src.match(/AVAILABLE_LOCALES\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
    if (!block) throw new Error('Could not read AVAILABLE_LOCALES from ' + CONSTANT_FILE);
    return (block[1].match(/'([A-Za-z_]+)'/g) || []).map(s => s.replace(/'/g, ''));
}

module.exports = { availableLocales, PLUGIN_ROOT, LANG_DIR, DOMAIN, CONSTANT_FILE };
