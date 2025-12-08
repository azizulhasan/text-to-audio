import { __ } from '@wordpress/i18n'
import React, { useState } from "react";

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
            [ // pro video
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
    }

    if (!window.hasOwnProperty('ttsObj')) return null;

    // Video Card Component
    const VideoCard = ({ video }) => (
        <a 
            href={'https://www.youtube.com/watch?v=' + video.id}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'block',
                textDecoration: 'none',
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ 
                position: 'relative',
                paddingTop: '56.25%',
                background: '#f0f0f0'
            }}>
                <img 
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255, 0, 0, 0.9)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <i className="fas fa-play" style={{ 
                        color: 'white', 
                        fontSize: '20px',
                        marginLeft: '3px'
                    }}></i>
                </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
                <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#333',
                    fontWeight: '500',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {video.title}
                </p>
            </div>
        </a>
    );

    // Get appropriate videos based on pro status
    const getVideos = () => {
        if (promotionType === 'youtube') {
            const videoIndex = ttsObj.is_pro_active ? 1 : 0;
            return proFeatures.youtube[videoIndex];
        }
        return [];
    };

    const videos = getVideos();

    return (
        <div style={{ position: 'sticky', top: '20px' }}>
            {/* Read Documentation Section */}
            <div style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => window.open('https://atlasaidev.com/docs/text-to-speech/', '_blank')}
            >
                <span style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600'
                }}>
                    Read Documentation
                </span>
                <i className="fas fa-chevron-down" style={{ 
                    color: 'white',
                    fontSize: '16px'
                }}></i>
            </div>

            {/* Watch Tutorials Section */}
            {promotionType === 'youtube' && (
                <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}>
                            Watch Tutorials
                        </span>
                        <i className="fas fa-chevron-up" style={{ 
                            color: 'white',
                            fontSize: '16px'
                        }}></i>
                    </div>

                    {/* Content */}
                    <div style={{
                        padding: '20px',
                        maxHeight: '600px',
                        overflowY: 'auto'
                    }}>
                        {videos.map((video, index) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                </div>
            )}

            {/* General Features List (for non-youtube promotion) */}
            {promotionType === 'general' && !ttsObj.is_pro_active && (
                <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    marginTop: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a4d4d 0%, #2d6a6a 100%)',
                        padding: '16px 20px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: 0
                        }}>
                            Pro Features
                        </h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {proFeatures.general.map((feature, index) => (
                                <li key={index} style={{
                                    padding: '12px 0',
                                    borderBottom: index < proFeatures.general.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    fontSize: '14px',
                                    color: '#333'
                                }}>
                                    <i className="fas fa-check-circle" style={{ 
                                        color: '#9EF01A',
                                        marginTop: '2px',
                                        minWidth: '16px'
                                    }}></i>
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
                                background: 'linear-gradient(135deg, #1a4d4d 0%, #2d6a6a 100%)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                marginTop: '20px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Upgrade to Pro
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}