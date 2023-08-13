import React from 'react';
import { Accordion, Table, Container, Row, Col } from 'react-bootstrap';
import toast from '../../context/Notify';
import { copyToClipBoard } from '../../context/utilities';
import UpgradeToPro from '../../UpgradeToPro';
export default function Docs() {
	/**
	 * Copy Code
	 */
	// const copyToClipBoard = (id) => {
	// 	/* Get the text field */
	// 	var copyText = document.getElementById(id);

	// 	/* Copy the text inside the text field */
	// 	navigator.clipboard.writeText(copyText.innerText);

	// 	/* Alert the copied text */
	// 	toast('Copied to clipboard');
	// };

	/**
	 * Filters
	 */
	const filters = [
		{
			name: 'tta__content_title',
			arguments: '$description, $post',
		},
		{
			name: 'tta__content_description',
			arguments: '$description, $post',
		},
		{
			name: 'tta__content',
			arguments: '$content, $post',
		},
		{
			name: 'tta__listening_button',
			arguments: '$button'
		},
		{
			name: 'tta__button_text_arr',
			arguments: '$button_text_arr'
		},
	];
	return (
		<>
			<Container>
				<Row>
					<Col xs={12} sm={12} lg={8}>
						<Accordion>
							<Accordion.Item eventKey='1'>
								<Accordion.Header>
									1. Browser support issue on android phone on desktop
								</Accordion.Header>
								<Accordion.Body>
									This plugin is built on browser API. No external API is used. Here is the API used <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' >speechSynthesis</a>
									That is why it doesn’t support all android phones here you can check which android phone support this <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis#browser_compatibility'>speechSynthesis</a> API


									<br /><br />
									Another issue speechSynthesis API is differ browser to browser also divice to divice . So it changes the voices and languages based on browser. one language may available on desktop
									It can be not available on mobile phone. One voice may available on desktop, it may be not available on android.


									<br /><br />If you still facing problems regarding browser issues please on a <a target='_blank' href='http://atlasaidev.com/contact-us/'>ticket</a>.
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='2'>
								<Accordion.Header>
									2. Another voice language on mobile
								</Accordion.Header>
								<Accordion.Body>
									This plugin is built on browser API <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' >speechSynthesis</a>.
									<br />speechSynthesis API is differ browser to browser also divice to divice . So it changes the voices and languages based on browser. one language may available on desktop
									It can be not available on mobile phone. One voice may available on desktop, it may be not available on android.

								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='3'>
								<Accordion.Header>
									3. How to enable <code>speechSynthesis</code> on FireFox?
								</Accordion.Header>
								<Accordion.Body>
									<p>
										1. Open FireFox browser, open a new tab and search{' '}
										<code>about:config</code>. Now search with this string
										and enable as true.
									</p>
									<p>
										a. <strong>media.webspeech.synth.enabled</strong>{' '}
									</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='4'>
								<Accordion.Header>
									4. How to enable <code>SpeechRecognition</code> on FireFox?
								</Accordion.Header>
								<Accordion.Body>
									<p>
										1. Open FireFox browser, open a new tab and search{' '}
										<code>about:config</code>. Now search with these 2
										string and enable them as true.
									</p>
									<p>
										a. <strong>media.webspeech.recognition.enable</strong>{' '}
									</p>
									<p>
										b.{' '}
										<strong>
											media.webspeech.recognition.force_enable
										</strong>
									</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='5'>
								<Accordion.Header>
									5. How to change button text?
								</Accordion.Header>
								<Accordion.Body>
									You can change button text 2 ways one is by shortcode attribute. Another way is adding filter. But filter always overrides the shortcode attributes. Here is short code Example :{' '}
									<code>[tta_listen_btn listen_text="Listen" pause_text="Pause"  resume_text="Resume" replay_text="Replay" start_text="Start" stop_text="Stop"]</code>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='6'>
								<Accordion.Header>
									6. How to add custom css class to button?
								</Accordion.Header>
								<Accordion.Body>
									Add class on shortcode as an attribute. Example :{' '}
									<code>[tta_listen_btn class="custom_class"]</code>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='7'>
								<Accordion.Header>
									7. Filter Hooks Reference.
								</Accordion.Header>
								<Accordion.Body>
									<Table striped bordered hover size='sm'>
										<thead>
											<tr>
												<th>Sr.</th>
												<th>Filter Name</th>
												<th>Arguments</th>
											</tr>
										</thead>
										<tbody>
											{filters.length &&
												filters.map((filter, index) => {
													return (
														<tr key={filter.name}>
															<td>{++index}</td>
															<td>
																<code>{filter.name}</code>
															</td>
															<td>
																<code>{filter.argument}</code>
															</td>
														</tr>
													);
												})}
										</tbody>
									</Table>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='8'>
								<Accordion.Header>8. How to apply filters.</Accordion.Header>
								<Accordion.Body>
									<button
										className=''
										onClick={(e) => copyToClipBoard('filter_hook', false, "Filter Copied.", toast)}>
										<img
											src={tta_obj.image_url + '/copy.svg'}
											width='15px'
											alt='Copy short code to clipboard'
										/>
									</button>
									<div>
										Install the plugin <a href='https://wordpress.org/plugins/code-snippets/' target={'_blank'}>Code Snippets</a>
										Then Select Snippet {'>'} Add New
										Create a new snippet with this block of code
										<pre>
											<code id='filter_hook'>
												{`
              add_filter( 'tta__button_text_arr', 'tta__button_text_arr_callback' );
              function tta__button_text_arr_callback ($button_text_arr) {
		// Listen button
		$text_arr['listen_text'] = 'Listen'; // paste custem text
		$text_arr['pause_text'] = 'Pause'; // paste custem text
		$text_arr['resume_text'] = 'Resume'; // paste custem text
		$text_arr['replay_text'] = 'Replay'; // paste custem text
		// Record button text
		$text_arr['start_text'] = 'Start'; // paste custem text
		$text_arr['stop_text'] = 'Stop'; // paste custem text
		
		return $text_arr;
              }
              `}
											</code>
										</pre>
									</div>
								</Accordion.Body>
							</Accordion.Item>

							<Accordion.Item eventKey='9'>
								<Accordion.Header>
									9. What is the name of the block button?
								</Accordion.Header>
								<Accordion.Body>
									<strong>Customize Button</strong>
								</Accordion.Body>
							</Accordion.Item>
						</Accordion>
					</Col>
					<Col xs={12} sm={12} lg={4}>
						<UpgradeToPro />
					</Col>
				</Row>
			</Container >
		</>
	);
}
