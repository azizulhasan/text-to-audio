import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n'
import {
	ToggleButton, Form, Row, Col, Container, Tooltip,
	OverlayTrigger,
	Button
} from 'react-bootstrap';

/**
 *
 * Scripts
 */
import { postWithoutImage } from '../../context/utilities';
import toast from '../../context/Notify';
import UpgradeToPro from '../../UpgradeToPro';
import { MultiSelect } from '../../context/MultiSelect'

export default function Settings() {
	const [settings, setSettings] = useState({
		tta__settings_enable_button_add: false,
		tta__settings_display_btn_icon: false,
		tta__settings_allow_listening_for_post_types: ['post'],
		tta__settings_css_selectors: '',
		tta__settings_exclude_content_by_css_selectors: '',
		tta__settings_exclude_texts: '',
		tta__settings_exclude_tags: '',
		tta__settings_exclude_post_ids: '',
		tta__settings_display_button_if_user_logged_in: false,
		tta__settings_stop_auto_playing_after_switching_tab: false,
		tta__settings_stop_floating_button: false,
		tta__settings_exclude_categories: [],
		tta__settings_exclude_wp_tags: [],
	});
	const [postTypes, setPostTypes] = useState([]);
	const [isDataLoaded, setIsDataLoaded] = useState(false)


	useEffect(() => {
		/**
		 * Get data from and display to table.
		 */
		let formData = new FormData();
		formData.append('method', 'get');
		postWithoutImage(tta_obj.api_url + 'tta/v1/settings', formData).then(
			(res) => {
				setSettings({...settings, ...res.data });
				setIsDataLoaded(true)
			});
	}, []);

	useEffect(() => {
		if (window.hasOwnProperty('ttsObj') && ttsObj?.post_types) {
			let tempPostTypes = wp.hooks.applyFilters('tts_display_button_on_post_types', structuredClone(Object.keys(ttsObj.post_types)))
			setPostTypes(tempPostTypes)
		}
	}, [window.ttsObj])

	/**
	 * handle change
	 * @param {*} e
	 */
	const handleChange = (e, targetName = 'tta__settings_allow_listening_for_post_types') => {
		let value = '';
		console.log({targetName, e})
		if (Array.isArray(e)) {
			value = e;
			setSettings({
				...settings,
				...{ [targetName] : value },
			});
			return;
		} else {
			value = e.target.value
		}

		if (e.target.getAttribute('type') === 'checkbox') {
			value = e.target.checked
		}
		if(e.target.name == 'tta__settings_exclude_post_ids') {
			let ids = []
			if(ttsObj.is_pro_active) {
				ids = e.target.value?.split(',');
			}else{
				ids = e.target.value?.split(',')?.slice(0, 5);
			}
			value = ids;
		}

		if (!e.target.name) return;

		setSettings({
			...settings,
			...{ [e.target.name]: value },
		});
	};

	/**
	 * Handle form Submit
	 */
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!ttsObj.is_pro_active) {
			settings.tta__settings_css_selectors = ''
		}

		// return;
		let formData = new FormData();
		formData.append('fields', JSON.stringify(settings));
		formData.append('method', 'post');
		postWithoutImage(tta_obj.api_url + 'tta/v1/settings', formData)
			.then((res) => {
				setSettings(res.data);
				toast('Settings Data Saved');
				setIsDataLoaded(true)
			})
			.catch((err) => {
				console.log(err);
			});
	};

	return (
		isDataLoaded ? <React.Fragment>
			<Container>
				<Row>
					<Col xs={12} sm={12} lg={8}>
						<Form onSubmit={handleSubmit}>
							{/* Add Button or Player Automatically */}
							<Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_enable_button_add'>
										Add Button or Player Automatically
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Check // prettier-ignore
										type={'checkbox'}
										checked={settings.tta__settings_enable_button_add}
										onChange={(e) =>
											handleChange(e)
										}
										name={`tta__settings_enable_button_add`}
										id={`tta__settings_enable_button_add`}
									/>
								</Col>
							</Row>
							{/* Display Button Only If User Logged In. */}
							<Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_display_button_if_user_logged_in'>
									Display Button Only If User Logged In
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Check // prettier-ignore
										type={'checkbox'}
										checked={settings.tta__settings_display_button_if_user_logged_in}
										onChange={(e) =>
											handleChange(e)
										}
										name={`tta__settings_display_button_if_user_logged_in`}
										id={`tta__settings_display_button_if_user_logged_in`}
									/>
								</Col>
							</Row>
							{/* Stop Auto Play After Switching Tab. */}
							<Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_stop_auto_playing_after_switching_tab'>
									Stop Auto Play After Switching Tab
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Check // prettier-ignore
										type={'checkbox'}
										checked={settings.tta__settings_stop_auto_playing_after_switching_tab}
										onChange={(e) =>
											handleChange(e)
										}
										name={`tta__settings_stop_auto_playing_after_switching_tab`}
										id={`tta__settings_stop_auto_playing_after_switching_tab`}
									/>
								</Col>
							</Row>
							{/*When Scroll Down Stop Floating Player.  */}
							{
								window?.ttsObj?.is_pro_active && <>
									<Row className=' mt-3'>
										<Col xs={12} sm={6} lg={4}>
											<Form.Label htmlFor='tta__settings_stop_floating_button'>
											When Scroll Down Stop Floating Player
											</Form.Label>
										</Col>
										<Col xs={12} sm={12} lg={8}>
											<Form.Check // prettier-ignore
												type={'checkbox'}
												checked={settings.tta__settings_stop_floating_button}
												onChange={(e) =>
													handleChange(e)
												}
												name={`tta__settings_stop_floating_button`}
												id={`tta__settings_stop_floating_button`}
											/>
										</Col>
									</Row>
								</>
								
							}
							{/* Stop Auto Pause After Switching Tab. */}
							{/* <Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_stop_auto_pause_after_switching_tab'>
									Stop Auto Pause After Switching Tab
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Check // prettier-ignore
										type={'checkbox'}
										checked={settings.tta__settings_stop_auto_pause_after_switching_tab}
										onChange={(e) =>
											handleChange(e)
										}
										name={`tta__settings_stop_auto_pause_after_switching_tab`}
										id={`tta__settings_stop_auto_pause_after_switching_tab`}
									/>
								</Col>
							</Row> */}

							
							{/* Allow Listening For Post Type */}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_allow_listening_for_post_types'>
										Allow Listening For Post Type
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Group controlId="tta__settings_allow_listening_for_post_types">
										<MultiSelect
											id="tta__settings_allow_listening_for_post_types"
											name="tta__settings_allow_listening_for_post_types"
											onChange={handleChange}
											selectedItems={settings.tta__settings_allow_listening_for_post_types}
											options={postTypes} />
									</Form.Group>
								</Col>
							</Row>
							{/*Include Content By CSS Selector*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_css_selectors'>
										Include Content By CSS Selectors {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Include Content By CSS Selectors feature is available in pro version')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
									<Form.Control
										id="tta__settings_css_selectors"
										name="tta__settings_css_selectors"
										as='textarea'
										onChange={(e) => handleChange(e)}
										value={settings.tta__settings_css_selectors}
										placeholder={ttsObj.is_pro_active ? __('Multiple selector will be multiline.') : 'Some content may be missing, It can be found by css selectors'}
										disabled={ttsObj.is_pro_active ? false : true}
									/>
								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude Content By CSS Selector*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_content_by_css_selectors'>
										Exclude Content By CSS Selectors {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Exclude Content By CSS Selectors feature is available in pro version')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
									<Form.Control
										id="tta__settings_exclude_content_by_css_selectors"
										name="tta__settings_exclude_content_by_css_selectors"
										as='textarea'
										onChange={(e) => handleChange(e)}
										value={settings.tta__settings_exclude_content_by_css_selectors}
										placeholder={ttsObj.is_pro_active ? __('Multiple selector will be multiline.') : 'Exclude content by CSS selectors'}
										disabled={ttsObj.is_pro_active ? false : true}
									/>
								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude Tags To Speak*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_tags'>
										Exclude Tags To Speak {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Exclude Tags. So that its content skiped. Like ( Subscript, Superscript etc.) This is a pro feature.')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
									<Form.Control
										id="tta__settings_exclude_tags"
										name="tta__settings_exclude_tags"
										as='textarea'
										onChange={(e) => handleChange(e)}
										value={settings.tta__settings_exclude_tags}
										placeholder={ttsObj.is_pro_active ? __('Multiple Tags Will Be Pipe(|) Separated.') : __('Exclude tags is a pro feature.')}
										disabled={ttsObj.is_pro_active ? false : true}
									/>
								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude Texts To Speak*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_texts'>
										Exclude Texts To Speak {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Excluding texts to be spoken is a pro feature.')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
									<Form.Control
										id="tta__settings_exclude_texts"
										name="tta__settings_exclude_texts"
										as='textarea'
										onChange={(e) => handleChange(e)}
										value={settings.tta__settings_exclude_texts}
										placeholder={ttsObj.is_pro_active ? __('Multiple Texts Will Be Pipe(|) Separated.') : 'Exclude texts is a pro feature.'}
										disabled={ttsObj.is_pro_active ? false : true}
									/>
								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude Posts To Speak*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_post_ids'>
										Exclude Posts By IDs To Speak {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Exclude more than 5 IDs is a pro feature')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
									<Form.Control
										id="tta__settings_exclude_post_ids"
										name="tta__settings_exclude_post_ids"
										as='textarea'
										onChange={(e) => handleChange(e)}
										value={settings.tta__settings_exclude_post_ids}
										placeholder={ttsObj.is_pro_active ? __('Multiple IDs Will Be Comma(,) Separated.') : 'Excluding more than 5 IDs is a pro feature. Multiple IDs Will Be Comma(,) Separated.' }
									/>
								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude Categories To Speak*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_categories'>
										Exclude Categories To Speak {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Exclude more than 1 categories is a pro feature')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
										<MultiSelect
											id="tta__settings_exclude_categories"
											name="tta__settings_exclude_categories"
											multiselectIndex={1}
											onChange={handleChange}
											toastMessage={'On Free Version You Can Select Only 1 Category.'}
											selectedItems={settings.tta__settings_exclude_categories}
											options={Object.keys(ttsObj?.categories) || []} />

								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://atlasaidev.com/docs/text-to-speech/' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Exclude tags To Speak*/}
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_exclude_wp_tags'>
										Exclude Tags To Speak {ttsObj.is_pro_active ? "" : (
										<>
											{['top'].map((placement) => (
												<OverlayTrigger
													key={placement}
													placement={placement}
													overlay={
														<Tooltip id={`tooltip-${placement}`}>
															{__('Exclude more than 1 tags is a pro feature')}
														</Tooltip>
													}>
													<Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i className="fas fa-lock" /></Button>
												</OverlayTrigger>
											))}
										</>
									)}
									</Form.Label>
								</Col>
								<Col xs={11} sm={11} lg={7}>
										<MultiSelect
											id="tta__settings_exclude_wp_tags"
											name="tta__settings_exclude_wp_tags"
											multiselectIndex={2}
											onChange={handleChange}
											toastMessage={'On Free Version You Can Select Only 1 Tag.'}
											selectedItems={settings.tta__settings_exclude_wp_tags}
											options={Object.keys(ttsObj?.tags) || []} />

								</Col>
								<Col xs={1} sm={1} lg={1} className='mt-4'>
									<>
										{['top'].map((placement) => (
											<OverlayTrigger
												key={placement}
												placement={placement}
												overlay={
													<Tooltip id={`tooltip-${placement}`}>
														{__('Click To Know How It Works?')}
													</Tooltip>
												}>
												<a target='_blank' href='https://atlasaidev.com/docs/text-to-speech/' > <i className="fas fa-info-circle"></i></a>
											</OverlayTrigger>
										))}
									</>
								</Col>
							</Row>
							{/*Display Button Icon*/}
							 <Row className='mt-3'>
									{
									 !window?.ttsObjPro?.is_pro_active  &&
										<>
										<Col xs={12} sm={6} lg={4}>
											<Form.Label htmlFor='tta__settings_display_btn_icon'>
												Enable Button Icon
											</Form.Label>
										</Col>
										<Col xs={12} sm={12} lg={8}>
											<Form.Check // prettier-ignore
												type={'checkbox'}
												checked={settings.tta__settings_display_btn_icon}
												onChange={(e) =>
													handleChange(e)
												}
												name={`tta__settings_display_btn_icon`}
												id={`tta__settings_display_btn_icon`}
											/>
										</Col>
									</>
									}
									<div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
										<button type='submit' className='tta_btn  btn-block'>
											Save
										</button>
									</div>
							</Row>
						</Form>
					</Col>
					<Col xs={12} sm={12} lg={4}>
						<UpgradeToPro />
					</Col>
				</Row>
			</Container>
		</React.Fragment> : <h1>Loading</h1>

	);
}
