/**
 * TTS-258 — Centralized Pro marketing URL builder.
 *
 * The UTM campaign scheme + base pages are injected from PHP via
 * wp_localize_script, so the whole plugin links to Pro consistently from one
 * source of truth. Works in both bundles:
 *   - dashboard  → window.tta_obj.pro        (utm_medium=plugin_admin)
 *   - wizard     → window.ttsWizardData.pro  (utm_medium=onboarding)
 *
 * Call sites pass a descriptive `content` slug (utm_content) so every link is
 * attributable to its exact location, e.g. proUrl('analytics_tab').
 *
 * @see TTA\TTA_Helper::get_pro_url_config()
 */

const cfg =
    (typeof window !== 'undefined' &&
        ((window.tta_obj && window.tta_obj.pro) ||
            (window.ttsWizardData && window.ttsWizardData.pro) ||
            (window.ttsObj && window.ttsObj.pro))) ||
    {};

const BASES = cfg.bases || {
    pricing: 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
    product: 'https://atlasaidev.com/plugins/text-to-speech-pro/',
    demo: 'https://atlasaidev.com/plugins/text-to-speech-pro/demo/',
};

/**
 * Build a UTM-tagged Pro link.
 *
 * @param {string} content - utm_content slug for this call site (optional).
 * @param {'pricing'|'product'|'demo'} [page='pricing'] - which Pro page.
 * @returns {string}
 */
export const proUrl = (content = '', page = 'pricing') => {
    const base = BASES[page] || BASES.pricing;
    const params = new URLSearchParams({
        utm_source: cfg.source || 'text-to-audio',
        utm_medium: cfg.medium || 'plugin_admin',
        utm_campaign: cfg.campaign || 'free_to_pro',
    });
    if (content) {
        params.set('utm_content', content);
    }
    return base + (base.indexOf('?') === -1 ? '?' : '&') + params.toString();
};

/**
 * TTS-352 — 2.4 beta landing page (it serves both editions) and its feedback form.
 *
 * @param {'free'|'pro'} edition - preselects the edition on the beta page.
 * @param {string} [content] - utm_content slug for this call site.
 * @returns {string}
 */
export const betaUrl = (edition = 'free', content = '') => {
    const params = new URLSearchParams({
        src: 'plugin',
        edition: edition === 'pro' ? 'pro' : 'free',
        utm_source: cfg.source || 'text-to-audio',
        utm_medium: cfg.medium || 'plugin_admin',
        utm_campaign: 'atlasvoice_2_4_beta',
    });
    if (content) {
        params.set('utm_content', content);
    }
    return 'https://atlasvoice.cloud/atlasvoice-beta/?' + params.toString();
};

export const betaFeedbackUrl = (content = 'beta_feedback') => {
    const params = new URLSearchParams({
        utm_source: cfg.source || 'text-to-audio',
        utm_medium: cfg.medium || 'plugin_admin',
        utm_campaign: 'atlasvoice_2_4_beta',
        utm_content: content,
    });
    return 'https://atlasaidev.com/contact-us/?' + params.toString();
};

/**
 * TTS-264 — URL of the internal (in-admin) Pro pricing page.
 *
 * Upgrade CTAs target this in-context page (lower friction, one-click Freemius
 * checkout) instead of the external marketing site. Falls back to the external
 * pricing page if the localized admin URL isn't present.
 *
 * @param {string} [content] - utm_content slug used only for the external fallback.
 * @returns {string}
 */
export const pricingPageUrl = (content = '') => {
    const o =
        (typeof window !== 'undefined' &&
            (window.tta_obj || window.ttsObj || window.ttsWizardData)) ||
        {};
    return o.pricing_url || proUrl(content, 'pricing');
};

export default proUrl;
