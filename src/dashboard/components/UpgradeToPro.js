import {__} from '@wordpress/i18n'
import React from "react";

export default function UpgradeToPro({promotionType = 'general'}) {
    let proFeatures = {
        youtube: [
            [ // free video
                {
                    title : 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                },
                {
                    title : 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                },
                {
                    title : 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                },
                {
                    title : 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                },
                {
                    title : 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                },
                {
                    title : 'How To Customize Text To Speech WordPress Plugin Player With Custom CSS ?',
                    id: 'vdgJ_V2REE0?si=DSHrm7tlt8dbcF1R',
                },
                {
                    title : 'How To Change Text To Speech WordPress Plugin ( AtlasVoice ) Player Text And Hover Text?',
                    id: 'qDzatRpEXN8?si=jb3MSEA1FsOxadgV',
                },
            ],
            [ // pro video
                {
                    title : 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                },
                {
                    title : 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                },
                {
                    title : 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                },
                {
                    title : 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                },
                {
                    title : 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                },
                {
                    title : 'How to Configure GTranslate And Text To Speech Pro ( AtlasVoice ) WordPress Plugin',
                    id: 'uMJBdM24w_c?si=XZ0hsLADaQiB2UN2',
                },
            ]
        ],
        general: [
            'Get Live Support for setup.',
            '51 languages support in pro version.',
            '<a target="_blank" href="https://atlasaidev.com/refund-policy/">Bulk MP3 File Generation</a>',
            'Advance Analytics',
            'Text Aliases',
            'Unlimited Characters',
            '14 Days money back guarantee.<a target="_blank" href="https://atlasaidev.com/refund-policy/"> Conditions applies' +
            '                                </a>',
            '<a target=\'_blank\' href="https://wordpress.org/plugins/gtranslate/">GTranslate Plugin\n' +
            '                                Support</a>',
            '<a target=\'_blank\'\n' +
            '                               href="https://www.youtube.com/watch?v=4dsbhaBavms&t=43s&ab_channel=AtlasAiDev">You Can\n' +
            '                                Integrate\n' +
            '                                With Google Cloud Text To Speech.</a>',
            '<a target=\'_blank\'\n' +
            '                               href="https://www.youtube.com/watch?v=6uGPboXW2Q8">You Can\n' +
            '                                Integrate\n' +
            '                                With ChatGPT TTS.</a>',
            'Get more than 200 voices with Google Cloud Text To Speech.',
            'Download the audio file for offline listening.',
            'Multiple Audio Player Support.',
            'Include Content By CSS Selectors',
            'Exclude HTML Tags To Speak',
            'Exclude Texts To Speak',
            'Exclude Tags To Speak',
            'Exclude Categories To Speak',
        ],
        analytics: [
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
        compatible: [
            __("WPML Multilingual Support"),
            __("Gtranslate Plugin Support"),
            __("Advance Custom Field ( ACF ) Support"),
            __("WooCommerce Support"),
            __("Elementor Page Builder Plugin Support"),
            __("WP Bakery Page Builder Plugin Support"),
            __("All Android Support"),
            __('All Browser Support')
        ]
    }
    return <>
        {
            window.hasOwnProperty('ttsObj') && (ttsObj.is_pro_active || promotionType === 'youtube') ?
                <div className="card p-0">
                    <div className="card-header text-center tta_btn btn-center">
                        {
                            promotionType === 'youtube' ? 'Video Tutorials' :
                                <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/"
                                   className="tta_btn btn-center text-center text-white">Premium Features</a>

                        }
                    </div>
                    <div className="card-body">
                        <u className="list-group text-left">
                            {
                                Object.keys(proFeatures).map(type => {
                                    if (promotionType === type) {
                                        return proFeatures[promotionType].map((feature, index) => {
                                            if (promotionType === type && promotionType === 'youtube') {
                                                if (index == 0 && !ttsObj.is_pro_active) {
                                                    return feature.map((obj, index) => {

                                                        return <div className={'d-flex d-inline py-2'}>
                                                            <i className="fab fa-youtube text-danger me-2"></i>
                                                            <a target={'_blank'}
                                                               href={'https://www.youtube.com/watch?v=' + obj.id}>{obj.title}</a>
                                                        </div>

                                                    })
                                                }
                                                else if (index == 1 && ttsObj.is_pro_active) {
                                                    return feature.map((obj, index) => {
                                                        return <div className={'d-flex d-inline py-2'}>
                                                            <i className="fab fa-youtube text-danger me-2"></i>
                                                            <a target={'_blank'}
                                                               href={'https://www.youtube.com/watch?v=' + obj.id}>{obj.title}</a>
                                                        </div>

                                                    })
                                                }
                                            } else {
                                                return <li className="list-group-item"
                                                           dangerouslySetInnerHTML={{__html: feature}}/>
                                            }


                                        })
                                    }
                                })
                            }
                        </u>
                        {
                            !ttsObj.is_pro_active &&
                            <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/"
                               className="tta_btn text-white">Unlock Premium Features</a>
                        }
                    </div>
                </div> : null
        }
    </>

}