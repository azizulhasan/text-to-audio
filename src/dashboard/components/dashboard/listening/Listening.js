import React, {useEffect, useState, useMemo} from 'react';
import {
    Col,
    Container,
    Row,
    Form,
    Button,
    Tooltip,
    OverlayTrigger,
} from 'react-bootstrap';
/**
 *
 * Scripts
 */
import {
    postWithoutImage,
    getData,
    setLocalStorage,
    getLocalStorage,
    gttsSupportedLanguages,
    areAllKeysNumeric
} from '../../context/utilities';
import toast from '../../context/Notify';
import {Link} from 'react-router-dom';
import UpgradeToPro from '../../UpgradeToPro';
import {array} from 'prop-types';

export default function Listening() {
    const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
    const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);
    const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);
    const [customizationSettings, setCustomizationSettings] = useState({});
    const [languageMissingMessage, setLanguageMissingMessage] = useState('');

    const [listeningSettings, setListeningSettings] = useState({
        tta__listening_voice: 'Google UK English Female',
        tta__listening_pitch: 2,
        tta__listening_rate: 1,
        tta__listening_volume: 1,
        tta__listening_lang: 'en-GB',
        tta__listening_activeLanguages_mapping: {},
        tta__multilingualActiveLanguages: {},
        tta__currentPlayerLanguages: {},
        tta__available_currentPlayerVoices: {},
    });
    const [listeningLang, setListeningLang] = useState('en-GB');
    const apiURL = useMemo(() => {
        if (window.hasOwnProperty('ttsObj') && ttsObj.is_pro_active) {
            return ttsObj.api_url + ttsObj.api_namespace + "_pro/" + ttsObj.api_version + "/";
        }

        return ttsObj.api_url + ttsObj.api_namespace + "/" + ttsObj.api_version + "/";
    })


    const [multilingualActiveLanguages, setMultilingualActiveLanguages] = useState([]);

    useEffect(() => {
        if (window?.ttsObjPro?.compatible?.['gtranslate/gtranslate.php']) {
            let gtranslateActiveLanguages = ttsObjPro?.compatible?.['gtranslate/gtranslate.php']?.GTranslate?.fincl_langs;
            // Initialize an empty object
            const languageObject = {};

            // Populate the object using a loop
            for (const langCode of gtranslateActiveLanguages) {
                languageObject[langCode] = langCode;
            }

            setMultilingualActiveLanguages(languageObject)


            setListeningSettings({
                ...listeningSettings,
                ...{tta__listening_activeLanguages_mapping: languageObject},
            });
        } else if (window?.ttsObjPro?.compatible?.['sitepress-multilingual-cms/sitepress.php']) {
            let gtranslateActiveLanguages = ttsObjPro?.compatible?.['sitepress-multilingual-cms/sitepress.php']?.active_languages;

            // Initialize an empty object
            const languageObject = {};
            let active_languages = Object.keys(gtranslateActiveLanguages);

            // Populate the object using a loop
            for (const langCode of active_languages) {
                languageObject[langCode] = gtranslateActiveLanguages[langCode].english_name;
            }

            setMultilingualActiveLanguages(languageObject)


            setListeningSettings({
                ...listeningSettings,
                ...{tta__listening_activeLanguages_mapping: languageObject},
            });
        }

    }, [window?.ttsObjPro])


    const setGoogleVoicesAndLanguages = () => {
        let stored_voices = getLocalStorage(['tta__voices']);
        if (!stored_voices?.tta__voices) {
            getData(apiURL + 'voices')
                .then((res) => {
                    if (res?.voices?.length) {
                        setLocalStorage({tta__voices: res.voices})
                    } else {
                        setVoicesAndLanguages()
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            let voices = JSON.parse(stored_voices.tta__voices);
            let langs = []
            let langs2 = []

            if (voices?.voices) {
                voices = voices.voices;
            }

            voices.map(voice => {
                if (!langs.includes(voice.languageCodes[0])) {
                    langs.push(voice.languageCodes[0])
                    langs2[voice.languageCodes[0]] = voice.languageCodes[0];
                }
            })

            setVoicesAndLanguages(voices, langs)
        }
    }

    useEffect(() => {

        if (window.hasOwnProperty('ttsObj') && ttsObj?.gctts_is_authenticated == 1) {
            setGoogleVoicesAndLanguages()
        } else {
            setVoicesAndLanguages()
        }
        /**
         * Set listening lang.
         */
        let data = new FormData();
        data.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/record', data)
            .then((res) => {
                setListeningLang(res.data.tta__recording__lang);
            })
            .catch((err) => {
                console.log(err);
            });

        /**
         * Set listening data.
         */
        let data2 = new FormData();
        data2.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/listening', data2)
            .then((res) => {
                setListeningSettings({
                    ...res.data,
                })
            })
            .catch((err) => {
                console.log(err);
            });


        /**
         * Get customize settings.
         */
        let customize = new FormData();
        customize.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
            .then((res) => {
                if(!res.data?.buttonSettings?.id){
                    res.data.buttonSettings.id = 1;
                }

                setCustomizationSettings(res.data);
                if (res?.data?.buttonSettings?.id < 3) {
                    setVoicesAndLanguages()
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);


    useEffect(() => {
        if (customizationSettings?.buttonSettings?.id < 3) {
            setVoicesAndLanguages()
        }
    }, [customizationSettings])

    const setVoicesAndLanguages = (voices = [], langs = [],) => {

        if (Array.isArray(voices) && voices.length) {
            setCurrentPlayerVoices(voices)
            setSpeechSynthesisVoices(voices)
        }
        if (Array.isArray(langs) && langs.length) {
            if (areAllKeysNumeric(langs)) {
                let newLangs = {};
                for (let lang of langs) {
                    newLangs[lang] = lang;
                }
                setCurrentPlayerLanguages(newLangs)

            } else {
                setCurrentPlayerLanguages(langs)
            }

        }

        if (Array.isArray(langs) && Array.isArray(voices) && voices.length) return;

        let timer = setTimeout(function handleTime() {
            timer = setTimeout(handleTime, 1000)

            if (timer > 65 || customizationSettings?.buttonSettings == undefined) {
                clearTimeout(timer)
                timer = null;
            }
            if (window.hasOwnProperty('speechSynthesis') && window.speechSynthesis.getVoices().length && customizationSettings?.buttonSettings?.id < 3) {
                clearTimeout(timer)
                timer = null
                setSpeechSynthesisVoices(window.speechSynthesis.getVoices())
                let newLangs = {};
                window.speechSynthesis.getVoices().map(item => {
                    if (!langs.includes(item.lang)) {
                        langs[item.lang] = item.lang;
                    }
                })
                setCurrentPlayerLanguages(langs)
                setCurrentPlayerVoices(window.speechSynthesis.getVoices())
            }
        })
    }

    useEffect(() => {
        if (window.hasOwnProperty('ttsObjPro') && ttsObjPro?.is_pro_active) {
            if (customizationSettings?.buttonSettings?.id == 3) {
                let gttsLanguages = gttsSupportedLanguages();
                setCurrentPlayerLanguages(gttsLanguages)
                setLanguageMissingMessage('')
            } else if (customizationSettings?.buttonSettings?.id < 3) {
                setLanguageMissingMessage('Looking for another language? Please select the another player from customization menu. Your language may be appear.')
            } else if (customizationSettings?.buttonSettings?.id == 4) {
                setGoogleVoicesAndLanguages();
                setLanguageMissingMessage('')
            }
        }

    }, [customizationSettings])

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
            if (key === '' || value === '') {
                toast('Please fill the  field : ' + key);
                return;
            }
            if (key === 'tta__available_currentPlayerVoices' || 'tta__currentPlayerLanguages' === key || 'tta__multilingualActiveLanguages' === key) {

                if (!ttsObj.is_pro_active) {
                    formData[key] = {};
                    continue;
                }


                if (!formData?.[key]) {
                    formData[key] = {};
                }
                if (!Object.keys(formData?.[key]).length) {
                    formData[key][customizationSettings?.buttonSettings?.id] = [];
                }
                formData[key][customizationSettings?.buttonSettings?.id].push(value);
            } else {
                formData[key] = value;
            }
        }
        formData.tta__available_currentPlayerVoices = {
            ...listeningSettings.tta__available_currentPlayerVoices,
            ...formData.tta__available_currentPlayerVoices,
        }

        formData.tta__currentPlayerLanguages = {
            ...listeningSettings.tta__currentPlayerLanguages,
            ...formData.tta__currentPlayerLanguages,
        }


        formData.tta__multilingualActiveLanguages = {
            ...listeningSettings.tta__multilingualActiveLanguages,
            ...formData.tta__multilingualActiveLanguages,
        }
        console.log(formData)
        // return;
        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/listening', data)
            .then((res) => {
                // console.log(res);
                setListeningSettings(res.data);
                toast('Listening settings saved. Now all setup done. Enjoy', 'info', {
                    autoClose: 15000
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };
    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e, index = '', player_id = '') => {

        if (e.target.name === 'tta__listening_lang' && customizationSettings?.buttonSettings?.id == 4) {
            // TODO: this filter will only be applied for default language not for WPML or GTranslate plugins.
            // let filteredVoices = speechSynthesisVoices.filter(voice => {
            //     return voice.languageCodes[0] == e.target.value;
            // })
            // if (filteredVoices.length === 1) {
            //     setListeningSettings({
            //         ...listeningSettings,
            //         ...{['tta__listening_voice']: filteredVoices[0].languageCodes[0]},
            //     });
            // }
            // setCurrentPlayerVoices(filteredVoices)
        }

        let listeningSettingsCloned = structuredClone(listeningSettings)

        if (e.target.name === 'tta__available_currentPlayerVoices' || 'tta__currentPlayerLanguages' === e.target.name || 'tta__multilingualActiveLanguages' === e.target.name) {
            if (!listeningSettingsCloned?.[e.target.name]?.[player_id]) {
                if (!Object.keys(listeningSettingsCloned[e.target.name]).length) {
                    listeningSettingsCloned[e.target.name] = {}
                }
                listeningSettingsCloned[e.target.name][player_id] = [];
            }
            listeningSettingsCloned[e.target.name][player_id][index] = e.target.value;
            if ('tta__multilingualActiveLanguages' != e.target.name) {
                setListeningSettings(listeningSettingsCloned);
            }
        } else {
            setListeningSettings({
                ...listeningSettings,
                ...{[e.target.name]: e.target.value},
            });
        }

    };

    const getActiveMultingualPluginName = () => {
        let activePluginName = '';
        if (window?.ttsObjPro?.compatible?.['sitepress-multilingual-cms/sitepress.php']) {
            activePluginName = 'WPML'
        } else if (window?.ttsObjPro?.compatible?.['gtranslate/gtranslate.php']) {
            activePluginName = "Gtranslate";
        }
        return activePluginName
    }
    return (
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col xs={12} sm={8} lg={8}>
                                <Form.Group>
                                    <Form.Label htmlFor='tta__listening_lang'>Voice Language</Form.Label>
                                    <Form.Select
                                        onChange={handleChange}
                                        name='tta__listening_lang'
                                        id='tta__listening_lang'
                                        value={listeningSettings.tta__listening_lang}
                                        aria-label='Default select example'>
                                        <option disabled>
                                            {' '}
                                            Default Listening Language
                                        </option>
                                        {Object.keys(currentPlayerLanguages).map((langKey, index) => {
                                            return (
                                                <option key={langKey}
                                                        value={customizationSettings?.buttonSettings?.id < 3 ? currentPlayerLanguages[langKey] : langKey}>
                                                    {currentPlayerLanguages[langKey]}
                                                </option>
                                            );
                                        })}
                                    </Form.Select>

                                    {
                                        languageMissingMessage && <Form.Label htmlFor='tta__listening_lang'><i
                                            className="fas fa-info-circle text-primary"></i> {languageMissingMessage}
                                        </Form.Label>

                                    }
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} lg={4} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (
                                        <OverlayTrigger
                                            key={placement}
                                            placement={placement}
                                            overlay={
                                                <Tooltip id={`tooltip-${placement}`}>
                                                    Gets and sets the language of the
                                                    utterance.
                                                </Tooltip>
                                            }>
                                            <Button className='tta_btn'>?</Button>
                                        </OverlayTrigger>
                                    ))}
                                </>
                            </Col>

                        </Row>

                        {
                            customizationSettings?.buttonSettings?.id != 3 && <Row>
                                <Col xs={12} sm={8} lg={8}>
                                    <Form.Group>
                                        <Form.Label htmlFor='tta__listening_voice'>Voice to speak </Form.Label>
                                        <Form.Select
                                            onChange={handleChange}
                                            name='tta__listening_voice'
                                            id='tta__listening_voice'
                                            value={listeningSettings.tta__listening_voice}
                                            aria-label='Default select example'>
                                            <option disabled>
                                                {' '}
                                                Default Listening Voice
                                            </option>
                                            {currentPlayerVoices.map((voice, index) => window.hasOwnProperty('ttsObjPro') && customizationSettings?.buttonSettings?.id == 4 ?
                                                <option key={index} data-lang={voice?.languageCodes?.[0]}
                                                        value={[voice.name, voice.ssmlGender].join('-')}>
                                                    {voice.name} {'-'} {voice.ssmlGender}
                                                </option> : <option key={index} data-lang={voice.lang} value={voice.name}>
                                                    {voice.name}
                                                </option>
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} sm={4} lg={4} className='mt-4'>
                                    <>
                                        {['top'].map((placement) => (
                                            <OverlayTrigger
                                                key={placement}
                                                placement={placement}
                                                overlay={
                                                    <Tooltip id={`tooltip-${placement}`}>
                                                        Gets and sets the voice that will be
                                                        used to speak
                                                    </Tooltip>
                                                }>
                                                <Button className='tta_btn'>?</Button>
                                            </OverlayTrigger>
                                        ))}
                                    </>
                                </Col>
                            </Row>
                        }
                        <Row>
                            <Col xs={12} sm={8} lg={8}>
                                <Form.Group>
                                    <Form.Label htmlFor='tta__listening_pitch'>Voice Pitch </Form.Label>
                                    <Form.Select
                                        onChange={handleChange}
                                        name='tta__listening_pitch'
                                        id='tta__listening_pitch'
                                        value={listeningSettings.tta__listening_pitch}
                                        aria-label='Default select example'>
                                        <option disabled>
                                            {' '}
                                            Default Listening Pitch
                                        </option>
                                        {[0, 1, 2].map((pitch, index) => {
                                            return (
                                                <option key={index} value={pitch}>
                                                    {pitch}
                                                </option>
                                            );
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} lg={4} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (
                                        <OverlayTrigger
                                            key={placement}
                                            placement={placement}
                                            overlay={
                                                <Tooltip id={`tooltip-${placement}`}>
                                                    Gets and sets the pitch at which the
                                                    utterance will be spoken at.
                                                </Tooltip>
                                            }>
                                            <Button className='tta_btn'>?</Button>
                                        </OverlayTrigger>
                                    ))}
                                </>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} sm={8} lg={8}>
                                <Form.Group>
                                    <Form.Label htmlFor='tta__listening_rate'>
                                        Voice Speed
                                    </Form.Label>
                                    <Form.Control
                                        type='text'
                                        id='tta__listening_rate'
                                        name='tta__listening_rate'
                                        onChange={handleChange}
                                        value={listeningSettings.tta__listening_rate}
                                        aria-describedby='tta__listening_rate'
                                    />
                                    <Form.Text id='tta__listening_rate' muted>
                                        Value : From 0.1 to 10.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} lg={4} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (
                                        <OverlayTrigger
                                            key={placement}
                                            placement={placement}
                                            overlay={
                                                <Tooltip id={`tooltip-${placement}`}>
                                                    Gets and sets the speed at which the
                                                    utterance will be spoken at. Value :
                                                    From 0.1 to 10
                                                </Tooltip>
                                            }>
                                            <Button className='tta_btn'>?</Button>
                                        </OverlayTrigger>
                                    ))}
                                </>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} sm={8} lg={8}>
                                <Form.Group>
                                    <Form.Label htmlFor='tta__listening_volume'>
                                        Voice Volume
                                    </Form.Label>
                                    <Form.Control
                                        type='text'
                                        id='tta__listening_volume'
                                        name='tta__listening_volume'
                                        onChange={handleChange}
                                        value={listeningSettings.tta__listening_volume}
                                        aria-describedby='tta__listening_volume'
                                    />
                                    <Form.Text id='tta__listening_volume' muted>
                                        Value : From 0 to 1.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} lg={4} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (
                                        <OverlayTrigger
                                            key={placement}
                                            placement={placement}
                                            overlay={
                                                <Tooltip id={`tooltip-${placement}`}>
                                                    Gets and sets the volume that the
                                                    utterance will be spoken at. Value :
                                                    From 0 to 1
                                                </Tooltip>
                                            }>
                                            <Button className='tta_btn'>?</Button>
                                        </OverlayTrigger>
                                    ))}
                                </>
                            </Col>
                        </Row>
                        <Row>
                            {
                                Object.keys(multilingualActiveLanguages).length ?
                                    <h1> {getActiveMultingualPluginName()} Plugin Language
                                        Mapping {!ttsObj.is_pro_active && <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            Language mapping for WPML, Gtranalate plugin is available in
                                                            the pro version.
                                                        </Tooltip>
                                                    }>
                                                    <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                        } </h1> : <></>
                            }
                        </Row>
                        <Row>
                            {
                                Object.keys(multilingualActiveLanguages).length ? Object.keys(multilingualActiveLanguages).map((languageCode, index) =>
                                    <Row key={index}>
                                        <Col xs={12} sm={4} lg={4}>
                                            <Form.Group>
                                                <Form.Label
                                                    htmlFor={'tta__multilingualActiveLanguages_index_' + index}>{multilingualActiveLanguages[languageCode]}</Form.Label>
                                                <Form.Select
                                                    onChange={handleChange}
                                                    name={'tta__multilingualActiveLanguages'}
                                                    id={'tta__multilingualActiveLanguages_index_' + index}
                                                    value={languageCode}
                                                    aria-label='Default select example'>
                                                    <option disabled>
                                                        {' '}
                                                        Default Listening Language
                                                    </option>
                                                    {Object.keys(multilingualActiveLanguages).map((langCode, index) => {
                                                        return (
                                                            <option key={index} value={langCode}>
                                                                {multilingualActiveLanguages[langCode]}
                                                            </option>
                                                        );
                                                    })}
                                                </Form.Select>

                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} sm={4} lg={4}>
                                            <Form.Label htmlFor={'tta__currentPlayerLanguages_index_' + index}>Select
                                                Language For {multilingualActiveLanguages[languageCode]}</Form.Label>
                                            <Form.Select
                                                onChange={(e) => handleChange(e, index, customizationSettings?.buttonSettings?.id)}
                                                name={'tta__currentPlayerLanguages'}
                                                id={'tta__currentPlayerLanguages_index_' + index}
                                                value={listeningSettings?.tta__currentPlayerLanguages?.[customizationSettings?.buttonSettings?.id]?.[index] ?? Object.keys(currentPlayerLanguages).filter(lang => {
                                                    if (customizationSettings?.buttonSettings?.id < 3) {
                                                        return currentPlayerLanguages[lang].startsWith(languageCode);
                                                    }
                                                    return lang.startsWith(languageCode)
                                                })[0]}
                                                aria-label='Default select example'>
                                                <option disabled>
                                                    {' '}
                                                    Default Listening Language
                                                </option>
                                                {Object.keys(currentPlayerLanguages).map((langKey, index) => {
                                                    return (
                                                        <option key={index}
                                                                value={customizationSettings?.buttonSettings?.id < 3 ? currentPlayerLanguages[langKey] : langKey}>
                                                            {currentPlayerLanguages[langKey]}
                                                        </option>
                                                    );
                                                })}
                                            </Form.Select>
                                        </Col>
                                        {
                                            customizationSettings?.buttonSettings?.id != 3 && Object.keys(currentPlayerLanguages).length &&
                                            <Col xs={12} sm={4} lg={4}>
                                                <Form.Label
                                                    htmlFor={'tta__available_currentPlayerVoices_index_' + index}>Select
                                                    Voice For {multilingualActiveLanguages[languageCode]}</Form.Label>
                                                <Form.Select
                                                    onChange={(e) => handleChange(e, index, customizationSettings?.buttonSettings?.id)}
                                                    name={'tta__available_currentPlayerVoices'}
                                                    id={'tta__available_currentPlayerVoices_index_' + index}
                                                    value={listeningSettings?.tta__available_currentPlayerVoices?.[customizationSettings?.buttonSettings?.id]?.[index] ?? Object.values(currentPlayerVoices).filter(voice => {
                                                        if (customizationSettings?.buttonSettings?.id < 3) {
                                                            return voice?.lang.startsWith(languageCode);
                                                        }
                                                        return voice?.name.startsWith(languageCode);
                                                    })[0]?.name}
                                                    aria-label='Default select example'>
                                                    <option disabled>
                                                        {' '}
                                                        Current Player Voice
                                                    </option>
                                                    {currentPlayerVoices.map((voice, index) => window.hasOwnProperty('ttsObjPro') && customizationSettings?.buttonSettings?.id == 4 ?
                                                        <option key={index} data-lang={voice?.languageCodes?.[0]}
                                                                value={voice.name}>
                                                            {voice.name} {'-'} {voice.ssmlGender}
                                                        </option> :
                                                        <option key={index} data-lang={voice.lang} value={voice.name}>
                                                            {voice.name}
                                                        </option>
                                                    )}
                                                </Form.Select>
                                            </Col>
                                        }

                                    </Row>) : <></>
                            }
                            <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn  btn-center'>
                                    Save
                                </button>
                            </div>
                        </Row>
                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro/>
                </Col>
            </Row>
        </Container>
    );
}
