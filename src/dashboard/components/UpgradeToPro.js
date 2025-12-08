import { __ } from '@wordpress/i18n'
import React, { useState } from "react";
import { Accordion } from "react-bootstrap";

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
{/* <div className="position-absolute top-50 start-50 translate-middle bg-danger bg-opacity-90 rounded-circle d-flex align-items-center justify-content-center p-1">
                <i className="fas fa-play text-white fs-7"></i>
            </div> */}
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
            <Accordion defaultActiveKey="" className='tta-custom-accordion'>
                <Accordion.Item eventKey="0">
                    <Accordion.Header className='tta-custom-orange-accordion'>
                        Read Documentation
                    </Accordion.Header>
                    <Accordion.Body>
                        {/* {documentationQA.map((item, index) => (
                            <div key={index} style={{ marginBottom: "15px" }}>
                                <h6 style={{ fontWeight: "600" }}>{item.q}</h6>
                                <p style={{ margin: 0, color: "#555" }}>{item.a}</p>
                            </div>
                        ))} */}
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
