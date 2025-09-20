import { __ } from '@wordpress/i18n'
import React from "react";

export default function UpgradeToPro({ promotionType = 'general' }) {
    let proFeatures = {
        youtube: [
            [ // free video
                {
                    title: 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                },
                {
                    title: 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                },
                {
                    title: 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                },
                {
                    title: 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                },
                {
                    title: 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                },
                {
                    title: 'How To Customize Text To Speech WordPress Plugin Player With Custom CSS ?',
                    id: 'vdgJ_V2REE0?si=DSHrm7tlt8dbcF1R',
                },
                {
                    title: 'How To Change Text To Speech WordPress Plugin ( AtlasVoice ) Player Text And Hover Text?',
                    id: 'qDzatRpEXN8?si=jb3MSEA1FsOxadgV',
                },
            ],
            [ // pro video
                {
                    title: 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                },
                {
                    title: 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                },
                {
                    title: 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                },
                {
                    title: 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                },
                {
                    title: 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                },
                {
                    title: 'How to Configure GTranslate And Text To Speech Pro ( AtlasVoice ) WordPress Plugin',
                    id: 'uMJBdM24w_c?si=XZ0hsLADaQiB2UN2',
                },
            ]
        ],
        general: [
            'Get Live Support for setup.',
            'Convert unlimited characters to MP3 in bulk.',
            'WPML, GTranslate, TranslatePress Plugins Support',
            'Works with ACF, SCF, and other popular plugins.',
            'Google Cloud Text-to-Speech & ChatGPT Text-to-Speech (usage fees apply)',
            'Save MP3 files directly to Google Cloud Storage.',
            'Live integration support + 14-day money-back guarantee (<a target="_blank" href="https://atlasaidev.com/refund-policy/">conditions apply</a>).',
            'Multiple audio player support',
            'Unlimited Download MP3 files',
            '200+ Voices with Google Cloud Text To Speech',
            'Customizable content selection with CSS selectors',
            'Exclude content by categories, tags, IDs',
            'Advance analytics',
            'Responsive Audio Player',
            'Text Aliases',
            'Unlimited Characters',
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
            window.hasOwnProperty('ttsObj') ?
                <div style={{ display: ttsObj.is_pro_active && promotionType !== 'youtube' ? 'none' : 'block' }} className="card p-0">
                    <div className="card-header text-center btn-center">
                        {
                            promotionType === 'youtube' ? <><button
                                    className="tta_btn btn-center text-center text-white"><span className="dashicons dashicons-youtube text-danger"></span> Video Tutorials</button> <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                                                                                                                                                                             className="tta_btn btn-center text-center text-white">Buy Now</a></> :
                                <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                    className="tta_btn btn-center text-center text-white">Buy Now</a>

                        }
                    </div>
                    <div className="card-body">
                        <u className="list-group text-left text-decoration-none">
                            {
                                Object.keys(proFeatures).map(type => {
                                    if (promotionType === type) {
                                        return proFeatures[promotionType].map((feature, index) => {
                                            if (promotionType === type && promotionType === 'youtube') {
                                                if (index == 0 && !ttsObj.is_pro_active) {
                                                    return feature.map((obj, index) => {

                                                        return <div key={obj.id} className='d-flex d-inline py-2 border-bottom border-width-2 border-gray-dark '>
                                                            <i className="fab fa-youtube text-danger me-2 mt-2"></i>
                                                            <a className={'text-decoration-none'} target={'_blank'}
                                                                href={'https://www.youtube.com/watch?v=' + obj.id}>{obj.title}</a>
                                                        </div>

                                                    })
                                                } else if (index == 1 && ttsObj.is_pro_active) {
                                                    return feature.map((obj, index) => {
                                                        return <div key={obj.id} className={'d-flex d-inline py-2 border-bottom border-width-2 border-gray-dark '}>
                                                            <i className="fab fa-youtube text-danger me-2 mt-2"></i>
                                                            <a className={'text-decoration-none'} target={'_blank'}
                                                                href={'https://www.youtube.com/watch?v=' + obj.id}>{obj.title}</a>
                                                        </div>

                                                    })
                                                }
                                            } else {
                                                return <li key={index} className="list-group-item"
                                                    dangerouslySetInnerHTML={{ __html: feature }} />
                                            }


                                        })
                                    }
                                })
                            }
                        </u>
                        {
                            !ttsObj.is_pro_active &&
                            <a target='_blank' href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                className="tta_btn text-white">Buy Now</a>
                        }
                    </div>
                </div> : null
        }
    </>
}