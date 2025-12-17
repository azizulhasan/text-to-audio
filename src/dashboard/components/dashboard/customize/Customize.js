import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Col, Container, Row, Form, Card, Button } from 'react-bootstrap';
import notify, { toast } from '../../context/Notify';
import { copyToClipBoard, postData, postWithoutImage } from '../../context/utilities';
import TextToSpeech from '../../../buttons/components/TextToSpeech';
import TextToSpeechThree from '../../../buttons/components/TextToSpeechThree';
import TextToSpeechFour from '../../../buttons/components/TextToSpeechFour';
import CustomizationTabs from './CustomizationTabs';
import UpgradeToPro from '../../UpgradeToPro';

let speech = null;
let TextToSpeechFree = null;

export default function Customize() {
    const defaultValue = {
        backgroundColor: '#ffffff',
        color: '#000000',
        hoverBackgroundColor: '#f0f0f0',
        hoverTextColor: '#000000',
        width: '100',
        height: '50',
        border: '2',
        border_color: '#000000',
        borderRadius: '10',
        fontSize: '20',
        tta_play_btn_shortcode: "[atlasvoice]",
        buttonSettings: {
            id: 1,
            button_position: 'before_content',
            display_player_to: ["all"],
            who_can_download_mp3_file: ["all"],
            generate_mp3_date_from: '',
            generate_mp3_date_to: ''
        },
        custom_css: '',
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
    }

    const [listeningBtnStyle, setListeningStyle] = useState(defaultValue);
    const [listeningBtnStyle2, setListeningStyle2] = useState({
        backgroundColor: '#FFFFFF',
        color: '#000000',
        width: '100%',
        border: '2px solid #000000',
        height: '50px',
        fontSize: '20px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
    });

    const [shortCode, setShortCode] = useState('[atlasvoice]');
    const [customCSS, setCustomCSS] = useState('');
    const [speakingText, setSpeakingText] = useState('');
    const [listeningSettings, setListeningSettings] = useState({});
    const [isGCAuthenticated, setGCIsAuthenticated] = useState(false);
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false)
    const [isChatGPTAuthenticated, setIsChatGPTAuthenticated] = useState(false)
    const [activeTab, setActiveTab] = useState('player');

    const setDefaultButtonSettingsIfNeeded = (res) => {
        if (!res.data?.buttonSettings) {
            res.data.buttonSettings = {}
        }
        if (!res?.data?.buttonSettings?.display_player_to || res?.data?.buttonSettings?.display_player_to.length < 1) {
            res.data.buttonSettings.display_player_to = ['all']
        }
        if (!res?.data?.buttonSettings?.who_can_download_mp3_file || res?.data?.buttonSettings?.who_can_download_mp3_file.length < 1) {
            res.data.buttonSettings.who_can_download_mp3_file = ['all']
        }

        if (!res?.data?.buttonSettings?.id) {
            res.data.buttonSettings.id = defaultValue.buttonSettings.id
        }
        if (!res?.data?.buttonSettings?.button_position) {
            res.data.buttonSettings.button_position = defaultValue.buttonSettings.button_position
        }

        return res;
    }

    useEffect(() => {
        let customize = new FormData();
        customize.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
            .then((res) => {
                res = setDefaultButtonSettingsIfNeeded(res)

                let css = {
                    ...listeningBtnStyle2,
                    ...{ backgroundColor: res.data.backgroundColor || defaultValue.backgroundColor },
                    ...{ color: res.data.color || defaultValue.color },
                    ...{ height: res.data?.height || defaultValue.height + 'px' },
                    ...{ fontSize: res.data?.fontSize || defaultValue.fontSize + 'px' },
                    ...{ marginTop: res.data?.marginTop || defaultValue.marginTop + 'px' },
                    ...{ marginBottom: res.data?.marginBottom || defaultValue.marginBottom + 'px' },
                    ...{ marginLeft: res.data?.marginLeft || defaultValue.marginLeft + '%' },
                    ...{ marginRight: res.data?.marginRight || defaultValue.marginRight + 'px' },
                    ...{ borderRadius: res.data?.borderRadius || defaultValue.borderRadius + 'px' },
                    ...{ border: res.data?.border || defaultValue.border + 'px solid ' },
                    ...{ width: [res.data.width, '%'].join('') },
                }
                css.border += res.data?.border_color || defaultValue.border_color;

                let value = {
                    ...res.data,
                    ...{ backgroundColor: res.data.backgroundColor || defaultValue.backgroundColor },
                    ...{ color: res.data.color || defaultValue.color },
                    ...{ height: res.data?.height || defaultValue.height },
                    ...{ fontSize: res.data?.fontSize || defaultValue.fontSize },
                    ...{ marginTop: res.data?.marginTop || defaultValue.marginTop },
                    ...{ marginBottom: res.data?.marginBottom || defaultValue.marginBottom },
                    ...{ marginLeft: res.data?.marginLeft || defaultValue.marginLeft },
                    ...{ marginRight: res.data?.marginRight || defaultValue.marginRight },
                    ...{ borderRadius: res.data?.borderRadius || defaultValue.borderRadius },
                    ...{ border: res.data?.border || defaultValue.border },
                    ...{ border_color: res.data?.border_color || defaultValue.border_color },
                    ...{ width: res.data?.width || defaultValue.width },
                    ...{ tta_play_btn_shortcode: res.data?.tta_play_btn_shortcode || defaultValue.tta_play_btn_shortcode },
                    ...{ custom_css: res.data?.custom_css || defaultValue.custom_css }
                }

                setListeningStyle(value);
                if (res.data.custom_css) {
                    setCustomCSS(res.data.custom_css || '');
                }
                setShortCode(res.data?.tta_play_btn_shortcode || defaultValue.tta_play_btn_shortcode);
                setListeningStyle2(css);
            })
            .catch((err) => {
                console.log(err);
            });

        let listening = new FormData();
        listening.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/listening', listening)
            .then((res) => {
                setListeningSettings(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
        let initialText = 'The most user-friendly Text-to-Speech Accessibility plugin. Just install and automatically add a Text to Audio player to your WordPress site!'

        localStorage.setItem('demo_listening_content', initialText)
        setSpeakingText(initialText);
        setTimeout(() => {
            if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
                window.TTS.contents[1] = initialText;
            }
        }, 1000)

        if (window.hasOwnProperty('ttsObj') && ttsObj?.is_pro_active) {
            postData(ttsObj.api_url + 'tta_pro/v1/get_auth_file', {}, "GET")
                .then((res) => {
                    if (res?.file && res?.is_authenticated) {
                        setGCIsAuthenticated(res.is_authenticated)
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false)
                    }
                })
                .catch((err) => {
                    console.log(err);
                });

            let data = new FormData();
            data.append('method', 'get');
            postData(ttsObj.api_url + 'tta_pro/v1/chat_gpt_tts', data)
                .then((res) => {
                    if (res.data?.currentTTSServic === 'chat_gpt_tts' && res?.data?.chatgpt_tts_api_key) {
                        setIsChatGPTAuthenticated(true)
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, []);

    const handleChange = (e, keyName = '') => {
        if (Array.isArray(e) && keyName) {
            let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)
            tempButtonSettings = {
                ...tempButtonSettings,
                ...{ [keyName]: e }
            }
            setListeningStyle({
                ...listeningBtnStyle,
                ...{ buttonSettings: tempButtonSettings }
            });
            return;
        }
        if (e.target.name === 'width' && (e.target.value > 100 || e.target.value < 0)) {
            toast('Value should between 0-100');
            return;
        }

        if (e.target.name == 'tta_play_btn_shortcode') {
            setShortCode(e.target.value);
            return;
        }

        if (e.target.name == 'custom_css') {
            setCustomCSS(e.target.value);
            return;
        }

        if (!['backgroundColor', 'width', 'color', 'height', 'border', 'border_color', 'fontSize', 'borderRadius', 'marginTop', 'marginBottom', 'marginRight', 'marginLeft', 'hoverBackgroundColor', 'hoverTextColor'].includes(e.target.name)) {
            if (e.target.name === 'button_position' && !['before_content', 'after_content'].includes(e.target.value) && !ttsObj.is_pro_active) {
                toast('This option is only available for pro version.', 'error');
                return;
            }

            let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)
            tempButtonSettings = {
                ...tempButtonSettings,
                ...{ [e.target.name]: e.target.value }
            }
            setListeningStyle({
                ...listeningBtnStyle,
                ...{ buttonSettings: tempButtonSettings }
            });

            if (e.target.name == 'id' && e.target.value > 2) {
                document.getElementById('tta__demo_text_for_play').setAttribute('disabled', true)
            } else {
                document.getElementById('tta__demo_text_for_play').removeAttribute('disabled')
            }
            return;
        }

        setListeningStyle({
            ...listeningBtnStyle,
            ...{ [e.target.name]: e.target.value },
        });

        let value = '';
        if (e.target.name === 'width') {
            let arr = [e.target.value, '%'];
            value = arr.join('');
        } else if (e.target.name === 'height') {
            value = e.target.value + 'px';
        } else if (e.target.name == 'border' || e.target.name == 'border_color') {
            if (e.target.name == 'border') {
                value = e.target.value + 'px solid ';
                value += listeningBtnStyle?.border_color ?? ' black';
            } else {
                value = listeningBtnStyle?.border ?? '1px ';
                if (value.indexOf('px') < 0) {
                    value += 'px';
                }
                value += ' solid ';
                value += e.target.value;
            }
        } else if (e.target.name === 'fontSize') {
            value = e.target.value + 'px';
        } else if (e.target.name === 'marginLeft') {
            value = e.target.value + '%';
        } else if (e.target.name === 'borderRadius' || e.target.name === 'marginTop' || e.target.name === 'marginBottom' || e.target.name === 'marginRight') {
            value = e.target.value + 'px';
        } else {
            value = e.target.value;
        }
        setListeningStyle2({
            ...listeningBtnStyle2,
            ...{ [e.target.name]: value },
        });
    };

    const CTANotice = (text_content = '') => {
        toast(<>
            <h6>{text_content}</h6>
            <button onClick={(e) => {
                window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
            }} className='tta_btn'>
                Buy Now
            </button>
        </>, 'info', {
            position: 'top-right',
            autoClose: 10000,
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        let form = new FormData(e.target);
        let formData = {};
        for (let [key, value] of form.entries()) {
            if (key !== 'custom_css' && key !== 'generate_mp3_date_to' && key !== 'generate_mp3_date_from') {
                if (key === '' || value === '') {
                    toast('Please fill the  field : ' + key);
                    return;
                }
            }
            if (!['backgroundColor', 'width', 'color', 'border', 'border_color', 'height', 'fontSize', 'borderRadius', 'marginTop', 'marginBottom', 'marginRight', 'marginLeft', 'hoverBackgroundColor', 'hoverTextColor'].includes(key)) {
                continue;
            }
            formData[key] = value;
        }

        formData['custom_css'] = customCSS;
        formData['tta_play_btn_shortcode'] = shortCode;
        formData['buttonSettings'] = listeningBtnStyle.buttonSettings;
        if (!formData?.buttonSettings?.button_position) {
            formData.buttonSettings.button_position = 'before_content';
        }
        if (!formData?.buttonSettings?.id) {
            formData.buttonSettings.id = 1;
        }

        if (formData?.buttonSettings?.id == 4) {
            if (ttsObj.is_pro_active && !isGCAuthenticated) {
                notify('To select this player you have to authenticate first from Integration menu', 'error', {
                    autoClose: 8000,
                });
                return;
            }
            if (!isGCAuthenticated) {
                CTANotice('Google Cloud TTS player is only in pro version.');
                return;
            }
        }

        if (formData?.buttonSettings?.id == 5) {
            if (ttsObj.is_pro_active && !isChatGPTAuthenticated) {
                notify('To select this player you have to authenticate first from Integration menu', 'error', {
                    autoClose: 8000,
                });
                return;
            }
            if (!isChatGPTAuthenticated) {
                CTANotice('ChatGPT TTS player is only in pro version.');
                return;
            }
        }

        if (!ttsObj.is_pro_active && formData?.buttonSettings?.id > 1) {
            CTANotice('Default Pro player is only available for pro version.')
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable && formData?.buttonSettings?.id > 2 && !isBackUpToGCS) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', { autoClose: 10000 })
            return
        }

        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', data)
            .then((res) => {
                setListeningStyle(res.data);
                toast('Customization saved.', 'success');
                toast('Now go to the "Listening" menu to select proper language and voice.', 'error', {
                    autoClose: 15000
                })
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const callListeningFunction = (e) => {
        let text = document.getElementById('tta__demo_text_for_play').value;
        let button = document.getElementById('tta__listen_content');

        if (speech != null && speech.listenStatus == 'listen') {
            speech = null
            TextToSpeechFree = null
        }
        if (speech === null) {
            window.TTS.contents[1] = text
            TextToSpeechFree = window.TextToSpeech;
            speech = new TextToSpeechFree(1, text, button, window.TTS)
            speech._init()
            speech = speech.getData(false)
        } else {
            speech = speech.getData(false)
            if (speech.listenStatus == 'pause') {
                speech.pause(speech.speech)
            } else if (speech.listenStatus == 'resume') {
                speech.resume(speech.speech)
            }
        }
    };

    const setText = (e) => {
        setSpeakingText(e.target.value);
        localStorage.setItem('demo_listening_content', e.target.value);
        if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
            window.TTS.contents[1] = e.target.value;
        }
    };

    const [buttonLists, setButtonLists] = useState([
        { id: 1, name: 'Default', object: 'TextToSpeech', disabled: false },
        { id: 2, name: 'Default Pro', object: 'TextToSpeechPro', disabled: false },
        { id: 3, name: 'AtlasVoice TTS Pro', object: 'TextToSpeechPro', disabled: false },
        { id: 4, name: "Google Cloud TTS", object: 'TextToSpeechPro', disabled: false },
        { id: 5, name: "ChatGPT TTS", object: 'TextToSpeechPro', disabled: false },
    ])

    return (
        <Container fluid className="tta-container">
            <Row>
                <Col xs={12} lg={8}>
                    <div className="bg-white rounded p-3 mb-3 shadow-sm">
                        <h2 className="fs-3 fw-bold mb-2 text-dark">Customization</h2>
                        <p className="text-secondary m-0 small">Customize the player & design to match your brand and preferences.</p>
                    </div>

                    <div className="tta_tab-selector-wrapper mb-3">
                        <div 
                            className={`tta_tab-option ${activeTab === 'player' ? 'tta_tab-option-active' : ''}`}
                            onClick={() => setActiveTab('player')}
                        >
                            <span className="tta_tab-radio"></span>
                            <span>Player Customization</span>
                        </div>
                        <div 
                            className={`tta_tab-option ${activeTab === 'design' ? 'tta_tab-option-active' : ''}`}
                            onClick={() => setActiveTab('design')}
                        >
                            <span className="tta_tab-radio"></span>
                            <span>Design Customization</span>
                        </div>
                    </div>
                    
                    <CustomizationTabs 
                        buttonLists={buttonLists} 
                        customCSS={customCSS} 
                        handleSubmit={handleSubmit}
                        listeningBtnStyle={listeningBtnStyle} 
                        handleChange={handleChange}
                        listeningSettings={listeningSettings}
                        activeTab={activeTab}
                    />

                    {/* Only show these sections on player tab */}
                    {activeTab === 'player' && (
                        <>
                            <div className="bg-white rounded p-3 mb-3 shadow-sm">
                                <div className="mb-3">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <label className="mb-0 fw-semibold">Write here something and click listen button</label>
                                        <Button variant="link" className="p-0 text-muted" size="sm">
                                            <i className="fas fa-question-circle"></i>
                                        </Button>
                                        <Button variant="link" className="p-0 text-danger" size="sm">
                                            <i className="fab fa-youtube"></i>
                                        </Button>
                                    </div>
                                    <Form.Control
                                        as='textarea'
                                        id='tta__demo_text_for_play'
                                        onChange={(e) => setText(e)}
                                        value={speakingText ? speakingText : ''}
                                        placeholder='Write here something and click listen button.'
                                        rows={3}
                                        className="tta_custom-textarea"
                                    />
                                </div>

                                <div className="d-grid mb-0">
                                    {listeningBtnStyle?.buttonSettings?.id == 2 ?
                                        <TextToSpeech buttonCSS={listeningBtnStyle}
                                            button={<div dataId="1" id="tts__listent_content_1"
                                                className='tts__listent_content'></div>} buttonId={2} /> :
                                        listeningBtnStyle?.buttonSettings?.id == 3 ?
                                            <TextToSpeechThree buttonCSS={listeningBtnStyle}
                                                button={<div dataId="1" id="tts__listent_content_1"
                                                    className='tts__listent_content'></div>}
                                                buttonId={3} cssStyle={''} /> :
                                            listeningBtnStyle?.buttonSettings?.id == 4 ?
                                                <TextToSpeechFour buttonCSS={listeningBtnStyle}
                                                    button={<div dataId="1" id="tts__listent_content_1"
                                                        className='tts__listent_content'></div>}
                                                    buttonId={4} cssStyle={''} /> :
                                            listeningBtnStyle?.buttonSettings?.id == 5 ?
                                                <TextToSpeechThree buttonCSS={listeningBtnStyle}
                                                    button={<div dataId="1" id="tts__listent_content_1"
                                                        className='tts__listent_content'></div>}
                                                    buttonId={5} cssStyle={''} /> : (
                                                    <button
                                                        id='tta__listen_content'
                                                        onClick={(e) => callListeningFunction(e)}
                                                        style={listeningBtnStyle2}
                                                        type='button'
                                                        className="tta_listen-button"
                                                        title='Text To Audio:  Tap to listen post.'>
                                                        <i className="fas fa-play-circle me-2"></i>
                                                        {tta_obj.buttonTextArr.listen_text}
                                                    </button>
                                                )
                                    }
                                </div>
                            </div>

                            <div className="bg-white rounded p-3 mb-3 shadow-sm">
                                <h6 className="mb-3">Short Code | Attributes value must be wrapped with double quotation ( " )</h6>
                                <Form.Control
                                    as='textarea'
                                    name='tta_play_btn_shortcode'
                                    onChange={handleChange}
                                    value={shortCode}
                                    id='tta_play_btn_shortcode'
                                    rows={2}
                                    className="mb-3 tta_shortcode-textarea"
                                />
                                <button 
                                    size="sm"
                                    onClick={(e) => copyToClipBoard('tta_play_btn_shortcode', true, "Copied ShortCode", toast)}
                                    className='tta_shortcode_btn'
                                >
                                    <i className="fas fa-copy me-2"></i>
                                    Copy Shortcode
                                </button>
                            </div>
                        </>
                    )}
                </Col>

                <Col xs={12} lg={4}>
                    <UpgradeToPro promotionType={"youtube"} />
                </Col>
            </Row>
        </Container>
    );
}