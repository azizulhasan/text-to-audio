import React, { useState, useEffect } from 'react';
import { ToggleButton, Form, Row, Col, Container } from 'react-bootstrap';

/**
 *
 * Scripts
 */
import { postWithoutImage } from '../../context/utilities';
import toast from '../../context/Notify';
import UpgradeToPro from '../../UpgradeToPro';

export default function Settings() {
	const [settings, setSettings] = useState({
		tta__settings_enable_button_add: false,
		tta__settings_display_btn_icon: false,
		tta__settings_allow_listening_for_post_types: ['post'],
	});
	const [postTypes, setPostTypes] = useState([
		'post',
		'page',
	]);


	useEffect(() => {
		/**
		 * Get data from and display to table.
		 */
		let formData = new FormData();
		formData.append('method', 'get');
		postWithoutImage(tta_obj.api_url + 'tta/v1/settings', formData).then(
			(res) => {
				setSettings({ ...res.data });
			});


		if (window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
			let tempPostTypes = wp.hooks.applyFilters('tts_display_button_on_post_types', structuredClone(Object.keys(ttsObjPro.post_types)))
			setPostTypes(tempPostTypes)
		} else {
			let tempPostTypes = wp.hooks.applyFilters('tts_display_button_on_post_types', structuredClone(postTypes))
			setPostTypes(tempPostTypes)
		}

	}, []);

	/**
	 * handle change
	 * @param {*} e
	 */
	const handleChange = (e) => {
		let value = '';
		if (e.target.name === 'tta__settings_allow_listening_for_post_types') {
			value = Array.from(e.target.selectedOptions, option => option.value);
		} else {
			value = e.target.value
		}

		if (e.target.getAttribute('type') === 'checkbox') {
			value = e.target.checked
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
		let formData = new FormData();
		formData.append('fields', JSON.stringify(settings));
		formData.append('method', 'post');
		postWithoutImage(tta_obj.api_url + 'tta/v1/settings', formData)
			.then((res) => {
				setSettings(res.data);
				toast('Settings Data Saved');
			})
			.catch((err) => {
				console.log(err);
			});
	};

	return (

		<React.Fragment>
			<Container>
				<Row>
					<Col xs={12} sm={12} lg={8}>
						<Form onSubmit={handleSubmit}>
							<Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_enable_button_add'>
										Enable button add
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Group>
										<ToggleButton
											id='tta__settings_enable_button_add'
											type='checkbox'
											className='form-controll'
											name='tta__settings_enable_button_add'
											variant={
												settings.tta__settings_enable_button_add
													? 'outline-primary'
													: 'outline-danger'
											}
											checked={settings.tta__settings_enable_button_add}
											onChange={(e) =>
												handleChange(e)
											}>
											{settings.tta__settings_enable_button_add ? 'Enable' : 'Disable'}
										</ToggleButton>
									</Form.Group>
								</Col>
							</Row>
							<Row className='mt-4'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_allow_listening_for_post_types'>
										Allow Listening For Post Type
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Group controlId="tta__settings_allow_listening_for_post_types">
										<Form.Select
											id="tta__settings_allow_listening_for_post_types"
											name="tta__settings_allow_listening_for_post_types"
											onChange={handleChange}
											multiple={true}
											value={settings.tta__settings_allow_listening_for_post_types}>
											<option value={'0'}>
												Select recording post type
											</option>
											{postTypes.length && postTypes.map((posttype, i) => {
												return (
													<option key={i} value={posttype}>
														{posttype}
													</option>
												);
											})}
										</Form.Select>
									</Form.Group>
								</Col>
							</Row>
							<Row className=' mt-3'>
								<Col xs={12} sm={6} lg={4}>
									<Form.Label htmlFor='tta__settings_display_btn_icon'>
										Enable Button Icon
									</Form.Label>
								</Col>
								<Col xs={12} sm={12} lg={8}>
									<Form.Group>
										<ToggleButton
											id='tta__settings_display_btn_icon'
											type='checkbox'
											className='form-controll '
											variant={
												settings.tta__settings_display_btn_icon
													? 'outline-primary'
													: 'outline-danger'
											}
											checked={settings.tta__settings_display_btn_icon}
											name='tta__settings_display_btn_icon'
											onChange={(e) =>
												handleChange(e)
											}>
											{settings.tta__settings_display_btn_icon ? 'Enable' : 'Disable'}
										</ToggleButton>
									</Form.Group>
								</Col>
								<div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
									<button type='submit' className='tta_btn  btn-block'>
										Submit
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
		</React.Fragment>
	);
}
