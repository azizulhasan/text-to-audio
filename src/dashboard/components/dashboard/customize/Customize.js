import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n';
import {Col, Container, Row, Form, FloatingLabel} from 'react-bootstrap';
import toast from '../../context/Notify';
import {copyToClipBoard, postData, postWithoutImage} from '../../context/utilities';
import TextToSpeech from '../../../buttons/components/TextToSpeech';
import TextToSpeechThree from '../../../buttons/components/TextToSpeechThree';
import TextToSpeechFour from '../../../buttons/components/TextToSpeechFour';
import CustomizationTabs from './CustomizationTabs'
import notify from "../../context/Notify";

let speech = null;
let TextToSpeechFree = null;
export default function Customize() {
    const [listeningBtnStyle, setListeningStyle] = useState({
        backgroundColor: '#FFFFFF',
        color: '#000000',
        width: '100',
        height: '30',
        border: '0',
        border_color: '0',
        ['border-radius']: '4px',
        ['font-size']: '18',
        buttonSettings: {
            id: 1,
            button_position: 'before_content'
        }
    });
    const [listeningBtnStyle2, setListeningStyle2] = useState({
        backgroundColor: '#FFFFFF',
        color: '#000000',
        width: '100%',
        border: '0px',
        height: '30px',
        ['font-size']: '18px',
        ['border-radius']: '4px',
        display: 'flex',
        ['justify-content'] : 'center',
        ['align-items'] : 'center',
    });

    const [shortCode, setShortCode] = useState('[atlasvoice]');
    const [customCSS, setCustomCSS] = useState('');

    const [speakingText, setSpeakingText] = useState('');
    const [listeningSettings, setListeningSettings] = useState({});
    const [isGCAuthenticated, setGCIsAuthenticated] = useState(false);
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false)
    const [isChatGPTAuthenticated, setIsChatGPTAuthenticated] = useState(false)

    const setDefaultButtonSettingsIfNeeded = (res) => {
        let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)

        if (!res?.data?.buttonSettings?.display_player_to || res?.data?.buttonSettings?.display_player_to.length < 1) {
            res.data.buttonSettings.display_player_to = ['all']
        }
        if (!res?.data?.buttonSettings?.who_can_download_mp3_file || res?.data?.buttonSettings?.who_can_download_mp3_file.length < 1) {
            res.data.buttonSettings.who_can_download_mp3_file = ['all']
        }

        if (!res?.data?.buttonSettings?.id) {
            res.data.buttonSettings.id = tempButtonSettings.id
        }
        if (!res?.data?.buttonSettings?.button_position) {
            res.data.buttonSettings.id = tempButtonSettings.button_position
        }

        return res;
    }

    useEffect(() => {
        /**
         * Get customize settings.
         */
        let customize = new FormData();
        customize.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
            .then((res) => {
                res = setDefaultButtonSettingsIfNeeded(res)

                setListeningStyle(res.data);
                if (res.data.custom_css) {
                    setCustomCSS(res.data.custom_css);
                }
                setShortCode(res.data.tta_play_btn_shortcode);
                setListeningStyle2({
                    ...listeningBtnStyle2,
                    ...{backgroundColor: res.data.backgroundColor},
                    ...{color: res.data.color},
                    ...{height: res.data.height+ 'px'},
                    ...{['font-size']: res.data['font-size']+ 'px'},
                    ...{['border-radius']: res.data['border-radius']+ 'px'},
                    ...{border: res.data.border+ 'px solid '+ res.data.border_color},
                    ...{width: [res.data.width, '%'].join('')},
                });
            })
            .catch((err) => {
                console.log(err);
            });

        /**
         * Get listening settings.
         */
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

            // Check Google TTS API authentication.
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

            // check ChatGPT authentication.
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


    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e, keyName = '') => {
        if (Array.isArray(e) && keyName) {

            let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)

            tempButtonSettings = {
                ...tempButtonSettings,
                ...{
                    [keyName]: e
                }
            }
            setListeningStyle({
                ...listeningBtnStyle,
                ...{
                    buttonSettings: tempButtonSettings
                }
            });
            return;
        }
        if (
            e.target.name === 'width' &&
            (e.target.value > 100 || e.target.value < 0)
        ) {
            toast('Value should between 0-100');
            return;
        }
        /**
         * setShortCode
         */
        if (e.target.name == 'tta_play_btn_shortcode') {
            setShortCode(e.target.value);
            return;
        }

        /**
         * setCustomCSS
         */
        if (e.target.name == 'custom_css') {
            setCustomCSS(e.target.value);
            return;
        }

        // ChatGPT TTS player button settings
        // && listeningBtnStyle?.buttonSettings?.id == 3
        if (!['backgroundColor', 'width', 'color', 'height', 'border', 'border_color', 'font-size', 'border-radius'].includes(e.target.name)) {

            if (e.target.name === 'button_position' && !['before_content', 'after_content'].includes(e.target.value) && !ttsObj.is_pro_active) {
                toast('This option is only available for pro version.', 'error');
                return;
            }

            let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)

            tempButtonSettings = {
                ...tempButtonSettings,
                ...{[e.target.name]: e.target.value}
            }
            setListeningStyle({
                ...listeningBtnStyle,
                ...{
                    buttonSettings: tempButtonSettings
                }
            });

            if (e.target.name == 'id' && e.target.value > 2) {
                document.getElementById('tta__demo_text_for_play').setAttribute('disabled', true)
            } else {
                document.getElementById('tta__demo_text_for_play').removeAttribute('disabled')
            }


            return;
        }

        /**
         * set button style for database.
         */
        setListeningStyle({
            ...listeningBtnStyle,
            ...{[e.target.name]: e.target.value},
        });
        /**
         * set button style for live preveiw.
         */
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
                if(value.indexOf('px') < 0) {
                    value += 'px';
                }
                value += ' solid ';
                value += e.target.value;
            }
            // e.target.name = 'border';
        } else if (e.target.name === 'font-size') {
            value = e.target.value + 'px';
        }else if (e.target.name === 'border-radius') {
            value = e.target.value + 'px';
        } else {
            value = e.target.value;
        }

        setListeningStyle2({
            ...listeningBtnStyle2,
            ...{[e.target.name]: value},
        });
    };


    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        /**
         * Get full form data and modify them for saving to database.
         */
        let form = new FormData(e.target);

        let formData = {};
        for (let [key, value] of form.entries()) {
            if (key !== 'custom_css') {
                if (key === '' || value === '') {
                    toast('Please fill the  field : ' + key);
                    return;
                }
            }
            if (!['backgroundColor', 'width', 'color', 'border', 'border_color', 'height', 'font-size', 'border-radius'].includes(key)) {
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

        if (formData?.buttonSettings?.id == 4 && !isGCAuthenticated) {
            notify('To select this player you have to authenticate first from Integration menu', 'error', {
                autoClose: 8000,
            });
            return;
        }

        if (formData?.buttonSettings?.id == 5 && !isChatGPTAuthenticated) {
            notify('To select this player you have to authenticate first from Integration menu', 'error', {
                autoClose: 8000,
            });
            return;
        }

        if (!ttsObj.is_pro_active && formData?.buttonSettings?.id > 1) {
            toast('This player is only available for pro version.', 'error');
            return;
        }


        if (formData?.buttonSettings?.id == 4 && (!isGCAuthenticated || !ttsObj.is_pro_active)) {
            toast('To use Google Cloud Text To Speech you have to authenticate first from integrations menu', 'error');
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable && formData?.buttonSettings?.id > 2 && !isBackUpToGCS) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', {autoClose: 10000})
            return
        }
        ;

        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        // console.log(formData)
        // return;
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
            ;
        }
    };

    const [buttonLists, setButtonLists] = useState([
        {id: 1, name: 'Default', object: 'TextToSpeech', disabled: false},
        {id: 2, name: 'Default Pro', object: 'TextToSpeechPro', disabled: false},
        {id: 3, name: 'Google TTS Pro', object: 'TextToSpeechPro', disabled: false},
        {id: 4, name: "Google Cloud TTS", object: 'TextToSpeechPro', disabled: false},
        {id: 5, name: "ChatGPT TTS", object: 'TextToSpeechPro', disabled: false},
    ])

    return (
        <Container>
            <Row className='mt-5'>
                <Col xs={12} sm={12} lg={8}>
                    <Row>
                        <Col xs={12} sm={12} lg={12} className='mb-3'>
                            <>
                                <FloatingLabel
                                    controlId='tta__demo_text_for_play'
                                    label='Write here something and click listen button.'>
                                    <Form.Control
                                        as='textarea'
                                        onChange={(e) => setText(e)}
                                        onFocus={(e) =>
                                            toast('Write something here.')
                                        }
                                        value={speakingText ? speakingText : ''}
                                        placeholder='Write here something and click listen button.'
                                        style={{height: '100px'}}
                                    />
                                </FloatingLabel>
                            </>
                        </Col>
                        <Col xs={12} sm={12} lg={12} className='mb-3 mt-3'>
                            {
                                listeningBtnStyle?.buttonSettings?.id == 2 ?
                                    <TextToSpeech buttonCSS={listeningBtnStyle}
                                                  button={<div dataId="1" id="tts__listent_content_1"
                                                               className='tts__listent_content'></div>} buttonId={2}/> :
                                    listeningBtnStyle?.buttonSettings?.id == 3 ?
                                        <TextToSpeechThree buttonCSS={listeningBtnStyle}
                                                           button={<div dataId="1" id="tts__listent_content_1"
                                                                        className='tts__listent_content'></div>}
                                                           buttonId={3} cssStyle={''}/> :
                                        listeningBtnStyle?.buttonSettings?.id == 4 ?
                                            <TextToSpeechFour buttonCSS={listeningBtnStyle}
                                                              button={<div dataId="1" id="tts__listent_content_1"
                                                                           className='tts__listent_content'></div>}
                                                              buttonId={4} cssStyle={''}/> :
                                            listeningBtnStyle?.buttonSettings?.id == 5 ?
                                                <TextToSpeechThree buttonCSS={listeningBtnStyle}
                                                                   button={<div dataId="1" id="tts__listent_content_1"
                                                                                className='tts__listent_content'></div>}
                                                                   buttonId={5} cssStyle={''}/> : (
                                                    <button
                                                        id='tta__listen_content'
                                                        onClick={(e) => callListeningFunction(e)}
                                                        style={listeningBtnStyle2}
                                                        type='button'
                                                        title='Text To Audio:  Tap to listen post.'>
                                                        <span style={{fontSize:listeningBtnStyle2["font-size"]}} className='dashicons dashicons-controls-play'></span>{' '}
                                                        {tta_obj.buttonTextArr.listen_text}
                                                    </button>
                                                )
                            }
                            <p className='pt-2 text-danger'>
                                {
                                    listeningBtnStyle?.buttonSettings?.id == 1 && ttsObj.is_pro_active ? __('If you\'re selecting this button then you may not get pro features. Suppose CSS selectors from settings page and WPML/GTranslate will not work with this button.') : __('Save this player then configure proper voice and lanuage from listening menu. ')
                                }
                            </p>
                        </Col>

                        <Col xs={12} sm={12} lg={11} className='mt-3'>
                            <Form.Label htmlFor='tta_play_btn_shortcode'>
                                Short Code | Attributes value must be wrapped with double quotation ( " ).
                            </Form.Label>
                            <Form.Control
                                type='text'
                                name='tta_play_btn_shortcode'
                                onChange={handleChange}
                                value={shortCode}
                                id='tta_play_btn_shortcode'
                                title='Short code'
                            />
                        </Col>
                        <Col xs={12} sm={12} lg={1} className='mt-5'>
                            <button
                                onClick={(e) => copyToClipBoard('tta_play_btn_shortcode', true, "Copied ShortCode", toast)}>
                                <img
                                    src={tta_obj.image_url + '/copy.svg'}
                                    width='15px'
                                    alt='Copy short code to clipboard'
                                />
                            </button>
                        </Col>
                    </Row>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <CustomizationTabs buttonLists={buttonLists} customCSS={customCSS} handleSubmit={handleSubmit}
                                       listeningBtnStyle={listeningBtnStyle} handleChange={handleChange}
                                       listeningSettings={listeningSettings}/>
                </Col>
            </Row>
        </Container>
    );
}
