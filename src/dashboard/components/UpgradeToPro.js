import {__} from  '@wordpress/i18n'
export default function UpgradeToPro({ promotionType = 'general' }) {
    let proFeatures = {
        general : [
            'Get Live Support for first time Integration.',
            '51 languages support in pro version.',
            'Advance Analytics.',
            '<a target="_blank" href="https://atlasaidev.com/refund-policy/"> 14 Days money back\n' +
            '                                guarantee.</a>',
            '<a target=\'_blank\' href="https://wordpress.org/plugins/gtranslate/">GTranslate Plugin\n' +
            '                                Support</a>',
            '<a target=\'_blank\'\n' +
            '                               href="https://www.youtube.com/watch?v=4dsbhaBavms&t=43s&ab_channel=AtlasAiDev">You Can\n' +
            '                                Integrate\n' +
            '                                With Google Cloud Text To Speech.</a>',
            'Get more than 200 voices with Google Cloud Text To Speech.',
            'Download the audio file for offline listening.',
            'Multiple Audio Player Support.',
            'Include Content By CSS Selectors',
            'Exclude HTML Tags To Speak',
            'Exclude Texts To Speak',
            'Exclude Tags To Speak',
            'Exclude Categories To Speak',
        ],
        analytics : [
            __("Number of times the player button was initiated"),
            __("Number of times the play button was clicked"),
            __("Number of times the pause button was clicked"),
            __("Total time the player has played (in seconds)"),
            __("Number of times the player reached the end. 🔒"),
            __("Number of times the MP3 file downloaded. 🔒"),
            __("Percentage of times the play button was clicked after initiation. 🔒"),
            __("Percentage of times users listened till the end. 🔒"),
            __("Average listening time per play. 🔒"),
            __("Average number of pauses per play. 🔒"),
        ],
        compatible : [
            __("WPML Multilingual Support"),
            __("Gtranslate Plugin Support"),
            __("Advance Custom Field ( ACF ) Support"),
            __("WooCommerc Support"),
            __("Elementor Page Builder Plugin Support"),
            __("WP Bakery Page Builder Plugin Support"),
            __("All Android Support"),
            __( 'All Browser Support')
        ]
    }
    return <>
        {
            window.hasOwnProperty('ttsObj') && !ttsObj.is_pro_license_active ? <div className="card p-0">
                <div className="card-header text-center tta_btn btn-center">
                    <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/" className="tta_btn btn-center text-center text-white">Premium Features</a>
                </div>
                <div className="card-body">
                    <u className="list-group text-left">
                        {
                            Object.keys(proFeatures).map(type => {
                                if(promotionType === type) {
                                    return proFeatures[promotionType].map(feature => {
                                        return <li className="list-group-item" dangerouslySetInnerHTML={{ __html: feature }}/>
                                    })
                                }
                            })
                        }
                    </u>
                    <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/"
                       className="tta_btn text-white">Unlock Premium Features</a>
                </div>
            </div> : null
        }
    </>

}