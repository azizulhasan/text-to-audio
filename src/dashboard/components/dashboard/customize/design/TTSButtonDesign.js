import { Form } from 'react-bootstrap';
export default function TTSButtonDesign() {
    const [listeningBtnStyle, setListeningStyle] = useState({
        backgroundColor: '#FFFFFF',
        color: '#000000',
        width: '100',
        buttonNo: 3,
    });
    const [listeningBtnStyle2, setListeningStyle2] = useState({
        backgroundColor: '#FFFFFF',
        color: '#000000',
        width: '100%',
        border: '0',
        buttonNo: 3,
    });

    const [shortCode, setShortCode] = useState('[tta_listen_btn]');
    const [customCSS, setCustomCSS] = useState('');

    const [speakingText, setSpeakingText] = useState('');
    const [listeningSettings, setListeningSettings] = useState({});

    useEffect(() => {


        /**
         * Get customize settings.
         */
        let customize = new FormData();
        customize.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
            .then((res) => {
                setListeningStyle(res.data);
                if (res.data.custom_css) {
                    setCustomCSS(res.data.custom_css);
                }
                setShortCode(res.data.tta_play_btn_shortcode);
                setListeningStyle2({
                    ...listeningBtnStyle2,
                    ...{ backgroundColor: res.data.backgroundColor },
                    ...{ color: res.data.color },
                    ...{ width: [res.data.width, '%'].join('') },
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
        let initialText = 'Add functionality to wordpress site to read blogs out loud in any language and record blog by voice in any language.'

        localStorage.setItem('demo_listening_content', initialText)
        setSpeakingText(initialText);
        setTimeout(() => {
            if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
                window.TTS.contents[1] = initialText;
            }
        }, 1000)

    }, []);
    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
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
        console.log(e.target.value)
        /**
         * setCustomCSS
         */
        if (e.target.name == 'custom_css') {
            setCustomCSS(e.target.value);
            return;
        }
        /**
         * set button style for database.
         */
        setListeningStyle({
            ...listeningBtnStyle,
            ...{ [e.target.name]: e.target.value },
        });
        let value = '';
        if (e.target.name === 'width') {
            let arr = [e.target.value, '%'];
            value = arr.join('');
        } else {
            value = e.target.value;
        }
        /**
         * set button style for live preveiw.
         */
        setListeningStyle2({
            ...listeningBtnStyle2,
            ...{ [e.target.name]: value },
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

            formData[key] = value;
        }
        formData['custom_css'] = customCSS;
        formData['tta_play_btn_shortcode'] = shortCode;

        // console.log(formData);
        // return;
        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', data)
            .then((res) => {
                setListeningStyle(res.data);
                toast('Customize Data Saved');
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
    return (
        <Form onSubmit={handleSubmit}>
            <Form.Label htmlFor='backgroundColor'>
                BackGround Color
            </Form.Label>
            <Form.Control
                type='color'
                name='backgroundColor'
                onChange={handleChange}
                id='backgroundColor'
                value={listeningBtnStyle.backgroundColor}
                title='Choose your color'
            />
            <Form.Label htmlFor='color'>Text Color</Form.Label>
            <Form.Control
                type='color'
                name='color'
                onChange={handleChange}
                id='color'
                value={listeningBtnStyle.color}
                title='Choose your color'
            />
            <Form.Label htmlFor='width'>
                Button Width (%)
            </Form.Label>
            <Form.Control
                type='number'
                name='width'
                onChange={handleChange}
                id='width'
                min={'0'}
                max='100'
                value={listeningBtnStyle.width}
                title='Button Width'
            />
            <Form.Label htmlFor='custom_css'>Custom CSS</Form.Label>
            <Form.Control
                as='textarea'
                name='custom_css'
                id='custom_css'
                onChange={handleChange}
                value={customCSS ? customCSS : ''}
                placeholder='Custom CSS'
            />
            <div className='d-grid gap-3 col-12 mx-auto mt-5 mb-4'>
                <button
                    type='submit'
                    className='tta_btn  btn-center btn-block'>
                    Submit
                </button>
            </div>
        </Form>
    )
}