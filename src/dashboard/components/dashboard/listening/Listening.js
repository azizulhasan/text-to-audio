import React, { useEffect, useState, useMemo } from 'react';
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
import { postWithoutImage, getData, setLocalStorage, getLocalStorage } from '../../context/utilities';
import toast from '../../context/Notify';
import { langs } from '../recording/languages';
import { Link } from 'react-router-dom';
import UpgradeToPro from '../../UpgradeToPro';
import { array } from 'prop-types';
export default function Listening() {
	const [voices, setVoices] = useState([]);
	const [languages, setLanguages] = useState([]);
	const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);

	const [listeningSettings, setListeningSettings] = useState({
		tta__listening_voice: 'Microsoft David - English (United States)',
		tta__listening_pitch: 2,
		tta__listening_rate: 1,
		tta__listening_volume: 1,
		tta__listening_lang: 'en_GB',
	});
	const [listeningLang, setListeningLang] = useState('en_GB');
	const apiURL = useMemo(() => {
		if (window.hasOwnProperty('ttsObjPro') && ttsObjPro.should_activate_pro_features) {
			return ttsObjPro.api_url + ttsObjPro.api_namespace + "/" + ttsObjPro.api_version + "/";
		}

		return ttsObj.api_url + ttsObj.api_namespace + "/" + ttsObj.api_version + "/";
	})


	useEffect(() => {
		if (window.hasOwnProperty('ttsObjPro') && ttsObjPro.gtts_is_authenticated == '1') {
			let stored_voices = getLocalStorage(['tta__voices']);
			if (!stored_voices.tta__voices) {
				getData(apiURL + 'voices')
					.then((res) => {
						if (res.voices.length) {
							setLocalStorage({ tta__voices: res.voices })
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
				voices.voices.map(voice => {
					if (!langs.includes(voice.languageCodes[0])) {
						langs.push(voice.languageCodes[0])
					}
				})

				setVoicesAndLanguages(voices.voices, langs)
			}
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
				// console.log(res)
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
				// console.log(res.data)
				setListeningSettings(res.data);
			})
			.catch((err) => {
				console.log(err);
			});
	}, []);


	const setVoicesAndLanguages = (voices = [], langs = [],) => {

		if (Array.isArray(voices) && voices.length) {
			setVoices(voices)
			setSpeechSynthesisVoices(voices)
		}
		if (Array.isArray(langs) && langs.length) {
			setLanguages(langs)
		}

		if (Array.isArray(langs) && Array.isArray(voices) && voices.length) return;

		let timer = setTimeout(function handleTime() {
			timer = setTimeout(handleTime, 1000)
			if (window.hasOwnProperty('speechSynthesis') && window.speechSynthesis.getVoices().length) {
				clearTimeout(timer)
				timer = null
				setSpeechSynthesisVoices(window.speechSynthesis.getVoices())

				window.speechSynthesis.getVoices().map(item => {
					if (!langs.includes(item.lang)) {
						langs.push(item.lang)
					}
				})
				setLanguages(langs)
				setVoices(window.speechSynthesis.getVoices());
			}
		})
	}

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
			formData[key] = value;
		}

		// console.log(formData)
		// return;
		let data = new FormData();
		data.append('fields', JSON.stringify(formData));
		data.append('method', 'post');
		postWithoutImage(tta_obj.api_url + 'tta/v1/listening', data)
			.then((res) => {
				// console.log(res);
				setListeningSettings(res.data);
				toast('Listening Data Saved');
			})
			.catch((err) => {
				console.log(err);
			});
	};
	/**
	 * handle change
	 * @param {*} e
	 */
	const handleChange = (e) => {
		if (
			e.target.name == 'tta__listening_lang' &&
			e.target.value !== listeningLang
		) {
			toast('Listening language should be always recording language.', 'info', {
				autoClose: 5000
			});
		}
		if (e.target.name === 'tta__listening_lang' && window.hasOwnProperty('ttsObjPro') && ttsObjPro.gtts_is_authenticated == '1') {

			let filteredVoices = speechSynthesisVoices.filter(voice => {
				return voice.languageCodes[0] == e.target.value;
			})
			if (filteredVoices.length === 1) {
				setListeningSettings({
					...listeningSettings,
					...{ ['tta__listening_voice']: filteredVoices[0].languageCodes[0] },
				});
			}
			setVoices(filteredVoices)
		}

		setListeningSettings({
			...listeningSettings,
			...{ [e.target.name]: e.target.value },
		});
	};
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
										{languages.map((lang, index) => {
											return (
												<option key={index} value={lang}>
													{lang}
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
						<Row>
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
										{voices.map((voice, index) => window.hasOwnProperty('ttsObjPro') && ttsObjPro.gtts_is_authenticated ? <option key={index} data-lang={voice.languageCodes[0]} value={[voice.name, voice.ssmlGender].join('-')}>
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

						<Row>
							<Col xs={12} sm={8} lg={8}>
								<Form.Group>
									<Form.Label htmlFor='tta__listening_pitch' >Voice Pitch </Form.Label>
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
							<div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
								<button type='submit' className='tta_btn  btn-center'>
									Submit
								</button>
							</div>
						</Row>
					</Form>
				</Col>
				<Col xs={12} sm={12} lg={4}>
					<UpgradeToPro />
				</Col>
			</Row >
		</Container>
	);
}
