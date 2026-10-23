import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * TTS-352: AtlasMCP promotion on the setup wizard's finish screen (both the
 * "You're live" and the "Setup complete — you're in Staging" states).
 *
 * `promo` comes from TTA_Helper::get_atlasmcp_promo() via ttsWizardData:
 * hidden once AtlasMCP is active; the button opens WordPress's own plugin
 * screen and is left out for users who can't install (wp.org G8/11).
 * Pro's wizard renders the same card (StepProFinish).
 */
const styles = {
    card: {
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        textAlign: 'left',
        maxWidth: 560,
        margin: '0 auto 16px',
        padding: 16,
        backgroundColor: '#ffffff',
        border: '1px solid #dcdcde',
        borderRadius: 10,
    },
    icon: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#fff5f2',
        color: '#FF7853',
        flexShrink: 0,
    },
    body: { flex: '1 1 280px' },
    tag: {
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 6,
        backgroundColor: '#fff1ec',
        color: '#b3401f',
    },
    title: { margin: '6px 0 4px', fontSize: 16, fontWeight: 600, color: '#1d2327', lineHeight: 1.3 },
    text: { margin: '0 0 12px', fontSize: 13, color: '#50575e', lineHeight: 1.45 },
    actions: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
    btn: {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#FF7853',
        color: '#ffffff',
        padding: '7px 14px',
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
    },
    link: { fontSize: 13, fontWeight: 600, color: '#FF7853', textDecoration: 'none' },
};

const AtlasMcpWizardCard = ({ promo }) => {
    if (!promo || promo.status === 'active') {
        return null;
    }

    return (
        <div style={styles.card}>
            <span style={styles.icon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 12l5 5-1.5 1.5a3.5 3.5 0 0 1-5-5L7 12zM17 12l-5-5 1.5-1.5a3.5 3.5 0 0 1 5 5L17 12zM3 21l2.5-2.5M18.5 5.5L21 3M10 11l-2 2M14 15l-2 2"></path>
                </svg>
            </span>
            <div style={styles.body}>
                <span style={styles.tag}>{__('Free plugin · AtlasMCP', 'text-to-audio')}</span>
                <h4 style={styles.title}>{__('Run your site from Claude, ChatGPT and more', 'text-to-audio')}</h4>
                <p style={styles.text}>{__('Posts, WooCommerce, media and SEO, by chat.', 'text-to-audio')}</p>
                <div style={styles.actions}>
                    {promo.action_url && (
                        <a href={promo.action_url} style={styles.btn}>
                            {promo.status === 'installed' ? __('Activate AtlasMCP', 'text-to-audio') : __('Install AtlasMCP', 'text-to-audio')}
                        </a>
                    )}
                    <a href={promo.wporg_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        {__('Learn more on WordPress.org', 'text-to-audio')} →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AtlasMcpWizardCard;
