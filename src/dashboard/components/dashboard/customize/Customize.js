import React, { useState, useEffect } from 'react';
import { Col, Container, Row, Form, FloatingLabel } from 'react-bootstrap';
import toast from '../../context/Notify';
import { copyToClipBoard, postWithoutImage } from '../../context/utilities';
import TextToSpeech from '../../../buttons/components/TextToSpeech';
import TexToSpeechThree from '../../../buttons/components/TexToSpeechThree';

let speech = null;
let TextToSpeechFree = null;
export default function Customize() {
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
	const setText = (e) => {
		setSpeakingText(e.target.value);
		localStorage.setItem('demo_listening_content', e.target.value);
		if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
			window.TTS.contents[1] = e.target.value;;
		}
	};


	const [buttonLists, setButtonLists] = useState([
		{ id: 1, name: 'Default', object: 'TextToSpeech' },
		{ id: 2, name: 'Default Pro', object: 'TextToSpeechPro' },
		{ id: 5, name: "Google TTS Pro", object: 'TextToSpeechPro' },
		{ id: 4, name: "Google Cloud TTS Pro", object: 'TextToSpeechPro' },
		{ id: 3, name: "ChatGPT TTS Pro", object: 'TextToSpeechPro' }
	])

	// const getTTSButtonByButtonNo = (buttonNo) => {
	// 	{
	// 		listeningBtnStyle.buttonNo == 2 ?
	// 			<TextToSpeech buttonCSS={listeningBtnStyle} buttonLiveCSS={listeningBtnStyle2} button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={2} /> :
	// 			listeningBtnStyle.buttonNo == 3 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> : (
	// 				<button
	// 					id='tta__listen_content'
	// 					onClick={(e) => callListeningFunction(e)}
	// 					style={listeningBtnStyle2}
	// 					type='button'
	// 					title='Text To Audio:  Tap to listen post.'>
	// 					<span className='dashicons dashicons-controls-play'></span>{' '}
	// 					{tta_obj.buttonTextArr.listen_text}
	// 				</button>
	// 			)
	// 	}
	// }


	return (
		<Container>
			<Row className='mt-5'>
				<Col xs={12} sm={12} lg={8}>
					<Row>
						<Col xs={12} sm={12} lg={12} className='mb-3'>
							{
								listeningBtnStyle.buttonNo == 2 ?
									<TextToSpeech buttonCSS={listeningBtnStyle} buttonLiveCSS={listeningBtnStyle2} button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={2} /> :
									listeningBtnStyle.buttonNo == 3 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> :
										listeningBtnStyle.buttonNo == 4 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> :
											listeningBtnStyle.buttonNo == 5 ? <TexToSpeechThree button={<div dataId="1" id="tts__listent_content_1" className='tts__listent_content' ></div>} buttonId={3} cssStyle={''} /> : (
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
											toast('Write/Say something here.')
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
								Short Code
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
					<Form onSubmit={handleSubmit}>
						<h4>Customize Listening Button</h4>
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
				</Col>
			</Row>
		</Container>
	);
}
