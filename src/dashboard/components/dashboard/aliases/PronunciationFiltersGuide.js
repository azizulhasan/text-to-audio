import React from "react";
import { __ } from "@wordpress/i18n";
import toast from "../../context/Notify";

// TTS-319: developer guide for the two pronunciation filters. Shown to Pro
// users only (page card + Read Documentation panel).
const SNIPPET = `add_action( 'wp_enqueue_scripts', 'my_atlasvoice_pronunciation' );
add_action( 'admin_enqueue_scripts', 'my_atlasvoice_pronunciation' ); // Bulk MP3

function my_atlasvoice_pronunciation() {
    wp_add_inline_script( 'wp-hooks', "
        if ( window.wp && wp.hooks ) {
            // 1. Add your own rules (same format as this page).
            wp.hooks.addFilter( 'tts_text_aliases', 'my-site', function ( rules ) {
                rules.push( { actual_text: 'No. 1', to_read: 'number 1', apply_to_numbers: true } );
                return rules;
            } );

            // 2. Change the final text any way you like.
            wp.hooks.addFilter( 'tts_pronunciation_text', 'my-site', function ( text ) {
                return text.replace( /(\\\\d+)\\\\s?%/g, '$1 percent' );
            } );
        }
    " );
}`;

export default function PronunciationFiltersGuide() {
    const copy = () => {
        navigator.clipboard?.writeText(SNIPPET)
            .then(() => toast(__('Code copied', 'text-to-audio'), 'info', {autoClose: 2000}))
            .catch(() => {});
    };

    return (
        <div className="tta_aliases_dev_guide">
            <p>
                {__('Need a rule this page can\'t express? Add it with code. Your rules work in every player, on translated pages, and in Bulk MP3.', 'text-to-audio')}
            </p>
            <ul>
                <li><code>tts_text_aliases</code> — {__('add or change pronunciations, in the same format as this page.', 'text-to-audio')}</li>
                <li><code>tts_pronunciation_text</code> — {__('change the final text before it is spoken, for example a custom number format.', 'text-to-audio')}</li>
            </ul>
            <p>{__('Paste this into your child theme\'s functions.php or a code snippets plugin:', 'text-to-audio')}</p>
            <pre className="tta_aliases_dev_code"><code>{SNIPPET}</code></pre>
            <button type="button" className="tta_aliases_add_btn" onClick={copy}>
                {__('Copy code', 'text-to-audio')}
            </button>
            <p className="tta_aliases_dev_note">
                {__('After changing rules, delete and regenerate existing MP3 files so they use the new pronunciation.', 'text-to-audio')}
            </p>
        </div>
    );
}
