import { __ } from '@wordpress/i18n'
import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
// import Docs from './dashboard/docs/Docs';

export default function UpgradeToPro({ promotionType = 'general' }) {
    const [activeTab, setActiveTab] = useState('documentation');

    let proFeatures = {
        youtube: [
            [ // free video
                {
                    title: 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                    thumbnail: 'https://i.ytimg.com/vi/h4VJxM-mh74/mqdefault.jpg'
                },
                {
                    title: 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                    thumbnail: 'https://i.ytimg.com/vi/yanuoEBfG4A/mqdefault.jpg'
                },
                {
                    title: 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                    thumbnail: 'https://i.ytimg.com/vi/HFoqlkPCP80/mqdefault.jpg'
                },
                {
                    title: 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                    thumbnail: 'https://i.ytimg.com/vi/amkrAtVQGBY/mqdefault.jpg'
                },
                {
                    title: 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                    thumbnail: 'https://i.ytimg.com/vi/oeW652YKmG0/mqdefault.jpg'
                },
                {
                    title: 'How to Configure GTranslate And Text To Speech Pro ( AtlasVoice ) WordPress Plugin',
                    id: 'uMJBdM24w_c?si=XZ0hsLADaQiB2UN2',
                    thumbnail: 'https://i.ytimg.com/vi/uMJBdM24w_c/mqdefault.jpg'
                },
            ],
            [ // pro video - same list for now
                {
                    title: 'How To Setup Text To Speech Player Properly?',
                    id: 'h4VJxM-mh74?si=pmgy6TkvvppqtQV7',
                    thumbnail: 'https://i.ytimg.com/vi/h4VJxM-mh74/mqdefault.jpg'
                },
                {
                    title: 'How To Setup Settings Menu For AtlasVoice Text To Speech Pro WordPress Plugin?',
                    id: 'yanuoEBfG4A?si=WVJYL656B1LmrEVY',
                    thumbnail: 'https://i.ytimg.com/vi/yanuoEBfG4A/mqdefault.jpg'
                },
                {
                    title: 'Text To Speech Pro ( AtlasVoice Pro ) : How To Generate Bulk MP3 File?',
                    id: 'HFoqlkPCP80?si=XVBvLEp2ATKT7EXz',
                    thumbnail: 'https://i.ytimg.com/vi/HFoqlkPCP80/mqdefault.jpg'
                },
                {
                    title: 'How To Enable Analytics In Text To Speech Free And Pro WordPress Plugin?',
                    id: 'amkrAtVQGBY?si=ZI1HfRBYaR60PVVx',
                    thumbnail: 'https://i.ytimg.com/vi/amkrAtVQGBY/mqdefault.jpg'
                },
                {
                    title: 'How To Use Text Alias In AtlasVoice Text To Speech Free And Pro WordPress Plugin?',
                    id: 'oeW652YKmG0?si=q97jAR0pTT3LhhH-',
                    thumbnail: 'https://i.ytimg.com/vi/oeW652YKmG0/mqdefault.jpg'
                },
                {
                    title: 'How to Configure GTranslate And Text To Speech Pro ( AtlasVoice ) WordPress Plugin',
                    id: 'uMJBdM24w_c?si=XZ0hsLADaQiB2UN2',
                    thumbnail: 'https://i.ytimg.com/vi/uMJBdM24w_c/mqdefault.jpg'
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
    };

    if (!window.hasOwnProperty('ttsObj')) return null;

    /** -------------------------------
     * Video Card Component
     * ------------------------------- */
const VideoCard = ({ video }) => (
    <a 
        href={'https://www.youtube.com/watch?v=' + video.id}
        target="_blank"
        rel="noopener noreferrer"
        className="d-block text-decoration-none bg-white overflow-hidden mb-3 shadow-sm"
    >
        <div className="ratio ratio-16x9 position-relative bg-light">
            <img 
                src={video.thumbnail}
                alt={video.title}
                className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
            />
            {/* YouTube-style red play button */}
           <div className="tta-yt bg-danger">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                >
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>

        </div>
        <div className="p-3">
            <p className="m-0 small text-dark fw-medium lh-base">
                {video.title}
            </p>
        </div>
    </a>
);

    /** -------------------------------
     * Get Videos (Based on PRO)
     * ------------------------------- */
    const getVideos = () => {
        if (promotionType === 'youtube') {
            const videoIndex = ttsObj.is_pro_active ? 1 : 0;
            return proFeatures.youtube[videoIndex];
        }
        return [];
    };

    const videos = getVideos();

    /** -------------------------------
     * Fake Documentation Q&A for Accordion
     * (Replace with your real docs)
     * ------------------------------- */
    const documentationQA = [
        {
            q: "How to enable Text-to-Speech?",
            a: "Go to Settings → Enable the TTS toggle and configure your API keys."
        },
        {
            q: "Why is my MP3 not downloading?",
            a: "Check file permissions or enable bulk MP3 generation from plugin settings."
        },
        {
            q: "How to select content by CSS selector?",
            a: "Use a CSS class or ID, for example: .entry-content or #post-body."
        }
    ];

    return (
        <div style={{ position: 'sticky', top: '20px' }}>
            
            {/* Documentation Section → Accordion */}
            {/* Documentation Section → Main Accordion */}
            <Accordion defaultActiveKey="" className='tta-custom-accordion'>
                <Accordion.Item eventKey="0">
                    <Accordion.Header className='tta-custom-orange-accordion'>
                        Read Documentation
                    </Accordion.Header>
                   <Accordion.Body className="p-2">
                        {/* Nested Accordion for Q&A */}
                        <Accordion flush className="tta-qa-accordion">
                            {documentationQA.map((item, index) => (
                                <Accordion.Item 
                                    key={index} 
                                    eventKey={index.toString()}
                                    // style={{ 
                                    //     border: 'none',
                                    //     marginBottom: '5px'
                                    // }}
                                >
                                    <Accordion.Header
                                        // style={{
                                        //     fontWeight: "600",
                                        //     fontSize: "13px",
                                        //     padding: "8px 10px",
                                        //     backgroundColor: "transparent"
                                        // }}
                                    >
                                        {item.q}
                                    </Accordion.Header>
                                    <Accordion.Body 
                                        style={{ 
                                            padding: "8px 10px 10px 10px",
                                            color: "#555",
                                            fontSize: "13px",
                                            backgroundColor: "#fff"
                                        }}
                                    >
                                        {item.a}
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {/* <Docs/> */}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            {/* Watch Tutorials */}
            {promotionType === 'youtube' && (
                <Accordion defaultActiveKey="0" className='mt-2 tta-custom-accordion'>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header className='tta-custom-orange-accordion'>Watch Tutorials</Accordion.Header>
                        <Accordion.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {videos.map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            )}

            {/* General Promotion (Pro Features) */}
            {promotionType === 'general' && !ttsObj.is_pro_active && (
                <Accordion style={{ marginTop: "20px" }}>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>⭐ Pro Features</Accordion.Header>
                        <Accordion.Body>
                            <ul style={{ paddingLeft: "15px" }}>
                                {proFeatures.general.map((feature, index) => (
                                    <li key={index} style={{ marginBottom: "8px" }}>
                                        <span dangerouslySetInnerHTML={{ __html: feature }} />
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    background: '#1a4d4d',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    marginTop: '20px'
                                }}
                            >
                                Upgrade to Pro
                            </a>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            )}
        </div>
    );
}
