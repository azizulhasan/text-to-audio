import React, { useState, useEffect } from 'react';
import { Col, Container, Row, Form, FloatingLabel } from 'react-bootstrap';
import toast from '../../context/Notify';
import { copyToClipBoard, postWithoutImage } from '../../context/utilities';
import TextToSpeech from '../../../buttons/components/TextToSpeech';
import TexToSpeechThree from '../../../buttons/components/TexToSpeechThree';
import CustomizationTabs from './CustomizationTabs'

let speech = null;
let TextToSpeechFree = null;
export default function Customize() {
	const [listeningBtnStyle, setListeningStyle] = useState({
		backgroundColor: '#FFFFFF',
		color: '#000000',
		width: '100',
		buttonSettings: {
		}
	});
	const [listeningBtnStyle2, setListeningStyle2] = useState({
		backgroundColor: '#FFFFFF',
		color: '#000000',
		width: '100%',
		border: '0',
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
		let initialText = 'Add accessibility to WordPress site to read contents out loud in more than 51 languages.'

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

		/**
		 * setCustomCSS
		 */
		if (e.target.name == 'custom_css') {
			setCustomCSS(e.target.value);
			return;
		}

		// ChatGPT TTS player button settings
		// && listeningBtnStyle?.buttonSettings?.id == 3
		if (!['backgroundColor', 'width', 'color'].includes(e.target.name)) {

			let tempButtonSettings = structuredClone(listeningBtnStyle.buttonSettings)
			tempButtonSettings = {
				...tempButtonSettings,
				...{ [e.target.name]: e.target.value }
			}
			setListeningStyle({
				...listeningBtnStyle,
				...{
					buttonSettings: tempButtonSettings
				}
			});

			return;
		}

		/**
		 * set button style for database.
		 */
		setListeningStyle({
			...listeningBtnStyle,
			...{ [e.target.name]: e.target.value },
		});
		/**
		 * set button style for live preveiw.
		 */
		let value = '';
		if (e.target.name === 'width') {
			let arr = [e.target.value, '%'];
			value = arr.join('');
		} else {
			value = e.target.value;
		}
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
			if (!['backgroundColor', 'width', 'color'].includes(key)) {
				continue;
			}

			formData[key] = value;
		}

		formData['custom_css'] = customCSS;
		formData['tta_play_btn_shortcode'] = shortCode;
		formData['buttonSettings'] = listeningBtnStyle.buttonSettings;

		if (!ttsObj.is_pro_active && formData?.buttonSettings?.id > 1) {
			toast('This player is only available for pro version.', 'error');
			return;
		}

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
	const setText = (e) => {
		setSpeakingText(e.target.value);
		localStorage.setItem('demo_listening_content', e.target.value);
		if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
			window.TTS.contents[1] = e.target.value;;
		}
	};

	const [buttonLists, setButtonLists] = useState([
		{ id: 1, name: 'Default', object: 'TextToSpeech', disabled: false },
		{ id: 2, name: 'Default Pro', object: 'TextToSpeechPro', disabled: false },
		{ id: 3, name: 'Google TTS Pro', object: 'TextToSpeechPro', disabled: false },
		{ id: 4, name: "ChatGPT TTS(Soon)", object: 'TextToSpeechPro', disabled: true },
		{ id: 5, name: "Google Cloud TTS(Soon)", object: 'TextToSpeechPro', disabled: true },
	])

	return (
		<Container>
			<Row className='mt-5'>
				<Col xs={12} sm={12} lg={8}>
					<Row>
						<Col xs={12} sm={12} lg={12} className='mb-3'>
							{
								listeningBtnStyle?.buttonSettings?.id == 2 ?
									<TextToSpeech buttonCSS={listeningBtnStyle} button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={2} /> :
									listeningBtnStyle?.buttonSettings?.id == 3 ? <TexToSpeechThree buttonCSS={listeningBtnStyle} button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> :
										listeningBtnStyle?.buttonSettings?.id == 4 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> :
											listeningBtnStyle?.buttonSettings?.id == 5 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> : (
												<button
													id='tta__listen_content'
													onClick={(e) => callListeningFunction(e)}
													style={listeningBtnStyle2}
													type='button'
													title='Text To Audio:  Tap to listen post.'>
													<span className='dashicons dashicons-controls-play'></span>{' '}
													{tta_obj.buttonTextArr.listen_text}
												</button>
											)
							}
						</Col>
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
										style={{ height: '100px' }}
									/>
								</FloatingLabel>
							</>
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
							<button onClick={(e) => copyToClipBoard('tta_play_btn_shortcode', true, "Copied ShortCode", toast)}>
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
					<CustomizationTabs buttonLists={buttonLists} customCSS={customCSS} handleSubmit={handleSubmit} listeningBtnStyle={listeningBtnStyle} handleChange={handleChange} listeningSettings={listeningSettings} />
				</Col>
			</Row>
		</Container>
	);
}
