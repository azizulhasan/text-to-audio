export default function TTSCustomizationButton() {
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


    const [buttonLists, setButtonLists] = useState([
        { id: 1, name: 'Default', object: 'TextToSpeech' },
        { id: 2, name: 'Default Pro', object: 'TextToSpeechPro' },
        { id: 3, name: "ChatGPT TTS Pro", object: 'TextToSpeechPro' },
        { id: 4, name: "Google Cloud TTS Pro", object: 'TextToSpeechPro' },
        { id: 5, name: "Google TTS Pro", object: 'TextToSpeechPro' },
    ])
    return (
        <Form>
            <Form.Group>
                <Form.Label htmlFor='buttonNo'>
                    Select Button
                </Form.Label>
                <Form.Select
                    onChange={handleChange}
                    name='buttonNo'
                    id='buttonNo'
                    value={listeningBtnStyle.buttonNo}
                    aria-label='Default select Button'>
                    <option disabled>
                        {' '}
                        Select Button
                    </option>
                    {buttonLists.map((button, index) => {
                        return (
                            <option key={button.id} value={button.id}>
                                {button.name}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>
        </Form>
    )
}