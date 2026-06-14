import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};

/**
 * Wizard step — verify the player reads the correct content.
 *
 * TTS-247. The new staging/live system keeps the player hidden until the
 * admin confirms the extractor is reading the right text. This step launches
 * the AtlasVoice Selector (step-rail picker) on a real sample post in a new
 * tab; the admin uses "Preview Content" there to confirm, then returns and
 * continues. The actual Go Live choice happens on the Finish step.
 */
const StepContentCheck = ({ postType }) => {
    const [busy, setBusy] = useState(false);
    const [opened, setOpened] = useState(false);
    const [error, setError] = useState('');

    const docUrl = wizardData.steprail_doc_url || '';

    const openPicker = async () => {
        setBusy(true);
        setError('');
        try {
            const base = wizardData.api_url || '/wp-json/tta/v1/';
            const nonce = wizardData.nonce || '';
            // Prefer a sample of the post type the admin just chose; the
            // endpoint falls back to any published post when none matches.
            const q = postType
                ? '?scope=post_type&post_type=' + encodeURIComponent(postType)
                : '?scope=global';
            const res = await fetch(base + 'step-rail/sample-url' + q, {
                credentials: 'same-origin',
                headers: { 'X-WP-Nonce': nonce },
            });
            const json = await res.json();
            if (json && json.url) {
                window.open(json.url, '_blank', 'noopener');
                setOpened(true);
            } else {
                setError(
                    (json && json.reason) ||
                        __('No published post is available to preview yet. Publish a post first, then verify.', 'text-to-audio')
                );
            }
        } catch (e) {
            setError(__('Could not open the content preview. Please try again.', 'text-to-audio'));
        } finally {
            setBusy(false);
        }
    };

    const styles = {
        wrapper: { padding: '20px 0', maxWidth: 620, margin: '0 auto' },
        heading: { fontSize: 24, fontWeight: 600, color: '#1d2327', marginTop: 0, marginBottom: 8 },
        sub: { fontSize: 15, color: '#50575e', lineHeight: 1.6, marginBottom: 24 },
        card: {
            background: '#f6f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            padding: '22px 24px',
            marginBottom: 20,
        },
        steps: { margin: '0 0 4px', padding: 0, listStyle: 'none' },
        stepLi: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, fontSize: 14, color: '#1d2327', lineHeight: 1.5 },
        num: {
            flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
            background: '#FF7853', color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        },
        btn: {
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FF7853', color: '#fff', border: 'none',
            padding: '12px 26px', borderRadius: 4, fontSize: 15, fontWeight: 500,
            cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
        },
        openedNote: { marginTop: 12, fontSize: 13, color: '#00794f', lineHeight: 1.5 },
        errNote: { marginTop: 12, fontSize: 13, color: '#b32d2e', lineHeight: 1.5 },
        help: { fontSize: 13, color: '#50575e', lineHeight: 1.6, marginTop: 4 },
        docLink: { color: '#FF7853', textDecoration: 'none', fontWeight: 500 },
        tip: {
            marginTop: 18, padding: '12px 16px', background: '#fff8e5',
            border: '1px solid #f1d592', borderRadius: 8, fontSize: 13,
            color: '#6b5900', lineHeight: 1.5,
        },
    };

    return (
        <div style={styles.wrapper}>
            <h2 style={styles.heading}>{__('Check what gets read aloud', 'text-to-audio')}</h2>
            <p style={styles.sub}>
                {__('Before going live, make sure the player reads the right part of your content — and skips menus, sidebars, and footers. AtlasVoice starts in Staging (hidden from visitors) so you can verify first, with no audio generated until you Go Live.', 'text-to-audio')}
            </p>

            <div style={styles.card}>
                <ul style={styles.steps}>
                    <li style={styles.stepLi}>
                        <span style={styles.num}>1</span>
                        <span>{__('Click “Open content preview” — a sample post opens in a new tab with the AtlasVoice Selector.', 'text-to-audio')}</span>
                    </li>
                    <li style={styles.stepLi}>
                        <span style={styles.num}>2</span>
                        <span>{__('Open “Preview Content” on the right to see exactly what will be read. Adjust the content region if needed.', 'text-to-audio')}</span>
                    </li>
                    <li style={styles.stepLi}>
                        <span style={styles.num}>3</span>
                        <span>{__('Come back to this tab and continue — you’ll choose to Go Live on the last step.', 'text-to-audio')}</span>
                    </li>
                </ul>

                <button
                    type="button"
                    style={styles.btn}
                    disabled={busy}
                    onClick={openPicker}
                >
                    <span aria-hidden="true">{'▶'}</span>
                    {busy
                        ? __('Opening…', 'text-to-audio')
                        : (opened ? __('Open content preview again', 'text-to-audio') : __('Open content preview', 'text-to-audio'))}
                    <span aria-hidden="true">{'↗'}</span>
                </button>

                {opened && !error && (
                    <p style={styles.openedNote}>
                        {__('Opened in a new tab. Verify it reads correctly, then return here and click Next.', 'text-to-audio')}
                    </p>
                )}
                {error && <p style={styles.errNote}>{error}</p>}
            </div>

            <p style={styles.help}>
                {__('This is optional but recommended. You can always re-run it later from the dashboard.', 'text-to-audio')}
                {docUrl ? ' ' : ''}
                {docUrl && (
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
                        {__('Learn how the Staging → Live workflow works →', 'text-to-audio')}
                    </a>
                )}
            </p>

            <div style={styles.tip}>
                {__('Tip: nothing is shown to visitors and no MP3s are generated while you’re in Staging — so verifying costs you nothing.', 'text-to-audio')}
            </div>
        </div>
    );
};

export default StepContentCheck;
