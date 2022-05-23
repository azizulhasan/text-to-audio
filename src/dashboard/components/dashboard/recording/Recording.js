import React, { useState, useEffect } from "react";
import { ToggleButton, Form, Row, Col, Container } from "react-bootstrap";

/**
 *
 * Scripts
 */
import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import {  updateCountry, langs } from "./languages";

export default function Recording() {
	const [settings, setSettings] = useState({
		wps__recording__lang: "",
		is_record_continously: true,
		rest_nonce: wps_obj.rest_nonce,
		wps__sentence_delimiter: ".",
	});
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		/**
		 * Get data from and display to table.
		 */
		let data = new FormData();
		data.append("method", "get");
		postWithoutImage(wps_obj.api_url + "wps/v1/speech/record", data)
			.then((res) => {
				setSettings(res.data);
				setChecked(res.data.is_record_continously);
			})
			.catch((err) => {
				console.log(err);
			});

		/**
		 *
		 */

		// let select_language = document.querySelector("#select_language");
		// let select_dialect = document.querySelector("#select_dialect");

		// for (var i = 0; i < langs.length; i++) {
		// 	select_language.options[i] = new Option(langs[i][0], i);
		// }

		// select_language.selectedIndex = 6;
		// updateCountry();
		// select_dialect.selectedIndex = 6;
	}, []);

	/**
	 * handle change
	 * @param {*} e
	 */
	const handleChange = (e) => {
		setSettings({ ...settings, ...{ [e.target.name]: e.target.value } });
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
			if (key === "" || value === "") {
				toast("Please fill the  field : " + key);
				return;
			}

			formData[key] = value;
		}
		formData.is_record_continously = checked;
		let data = new FormData();
		data.append("fields", JSON.stringify(formData));
		data.append("method", "post");
		postWithoutImage(wps_obj.api_url + "wps/v1/speech/record", data)
			.then((res) => {
				// console.log(res);
				setSettings(res.data);
				setChecked(res.data.is_record_continously);
				toast("Recording Data Saved");
			})
			.catch((err) => {
				console.log(err);
			});
	};

	return (
		<Container>
			<Row id="settings" className="mt-4">
				<Col
					xs={12}
					sm={12}
					lg={12}
					className=" justify-content-start align-items-start mt-2">
					<h4>SpeechRecognition</h4>
				</Col>
			</Row>
			<Form onSubmit={handleSubmit}>
				<Row className="border ">
					<Col
						xs={12}
						sm={12}
						lg={12}
						className="d-flex flex-col justify-content-start align-items-start">
						<Form.Group>
							<Form.Label>Record In </Form.Label>
							<Form.Select
								onChange={handleChange}
								name="wps__recording__lang"
								value={settings.wps__recording__lang}
								aria-label="Default select example">
								<option disabled>
									{" "}
									Default Record Language
								</option>
								{Object.keys(langs).map(
									(lang_code, index) => {
										return (
											<option
												key={index}
												value={langs[lang_code][1][0]}>
												{langs[lang_code][0]}
											</option>
										);
									}
								)}
							</Form.Select>
						</Form.Group>
					</Col>
					{/* <Col
						xs={12}
						sm={12}
						lg={12}
						className="d-flex flex-col mt-3">
						<Form.Group>
							<Form.Label>Continuous Record</Form.Label>
							<select
								className="form-select bg-secondary text-light"
								id="select_language"
								onChange={updateCountry}></select>
							<select
								className="form-select bg-secondary text-light mt-2"
								id="select_dialect"></select>
						</Form.Group>
					</Col> */}

					<Col
						xs={12}
						sm={12}
						lg={12}
						className="d-flex flex-col mt-3">
						<Form.Group>
							<Form.Label>Continuous Record</Form.Label>
							<ToggleButton
								id="toggle-check"
								type="checkbox"
								className="form-controll"
								variant={
									checked
										? "outline-primary"
										: "outline-danger"
								}
								checked={checked}
								value="1"
								onChange={(e) =>
									setChecked(e.currentTarget.checked)
								}>
								{checked ? "Record" : "Not Record"}
							</ToggleButton>
						</Form.Group>
					</Col>

					<Col
						xs={12}
						sm={12}
						lg={12}
						className="d-flex flex-col mt-3">
						<Form.Group>
							<Form.Label>Sentence Delimiter</Form.Label>
							<Form.Control
								type="text"
								id="wps__sentence_delimiter"
								onChange={handleChange}
								value={settings.wps__sentence_delimiter}
								name="wps__sentence_delimiter"
								placeholder="Sendtence Delimiter"
							/>
						</Form.Group>
					</Col>

					<div className="d-grid gap-3 col-2 mx-auto mt-5 mb-4">
						<button type="submit" className="wps_btn btn-center">
							Submit
						</button>
					</div>
				</Row>
			</Form>
		</Container>
	);
}
