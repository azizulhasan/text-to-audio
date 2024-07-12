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
									1. Browser support issue on android phone and desktop
								</Accordion.Header>
								<Accordion.Body>
									This plugin is built on browser API. No external API is used. Here is the API used <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' >speechSynthesis</a>
									That is why it doesn’t support all android phones here you can check which android phone support this <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis#browser_compatibility'>speechSynthesis</a> API


									<br /><br />
									Another issue speechSynthesis API is differ browser to browser also divice to divice . So it changes the voices and languages based on browser. one language may available on desktop
									It can be not available on mobile phone. One voice may available on desktop, it may be not available on android.


									<br /><br />If you still facing problems regarding browser issues please on a <a target='_blank' href='http://atlasaidev.com/contact-us/'>ticket</a>.
									<br /><br /> There is no issue related to browser on <a target='_blank' href='https://atlasaidev.com/text-to-speech-pro/'>pro version.</a>
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
									<br /><br /> There is no issue releated to voices on <a target='_blank' href='https://atlasaidev.com/text-to-speech-pro/'>pro version.</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='3'>
								<Accordion.Header>
									3. Can I Restrict/Exclude Certain Words From Playing?
								</Accordion.Header>
								<Accordion.Body>
									<p>
										Absolutely! You have the flexibility to exclude specific content from being read
										aloud, and this feature is available in the <a target='_blank'
																					   href='https://atlasaidev.com/text-to-speech-pro/'>pro
										version.</a> of Text to Speech.
									</p>
									<p>
										Here’s how to exclude words from playback:
									</p>

									<p>Navigate to the Settings tab of Text to Speech Pro.</p>

										<p>Look for the “Exclude Texts To Speak” textarea.</p>
										<p>
											In this field, you can list the words or phrases you wish to exclude from being read aloud.
										</p>
										<p>
											If you want to exclude multiple words or phrases, simply separate them using the pipe symbol (|).
										</p>
										<p>
											With this capability, you can fine-tune the playback experience, ensuring that only the desired content is read aloud to your audience.
										</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='4'>
								<Accordion.Header>
									4. Is it possible to exclude specific HTML tags from being read aloud by the Text to Speech plugin?
								</Accordion.Header>
								<Accordion.Body>
									<p>
										Of course! With the <a target='_blank'
															   href='https://atlasaidev.com/text-to-speech-pro/'>pro
										version.</a> of Text to Speech, you gain the ability to skip the content
										enclosed within certain HTML tags during playback.
									</p>
									<p>
										**Here's how it works:**
									</p>
									<p>
									*Navigate to the Settings tab of Text to Speech Pro.
										</p>
										<p>
											*Locate the "Exclude Tag's Content" textarea.
										</p>
										<p>
											*In this field, you can specify the HTML tags whose content you want to exclude from being read aloud.
										</p>
										<p>
											*If you need to skip multiple tags, simply separate them using the pipe symbol (|).
										</p>
										<p>
											By utilizing this feature, you can tailor the reading experience to your preferences, ensuring that specific HTML elements are omitted from the audio playback.
										</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='5'>
								<Accordion.Header>
									5. How to change button text?
								</Accordion.Header>
								<Accordion.Body>
									You can change button text 2 ways one is by shortcode attribute. Another way is
									adding filter. But filter always overrides the shortcode attributes. Here is short
									code Example :{' '}
									<pre>
										<code>[tta_listen_btn listen_text="Listen" pause_text="Pause" resume_text="Resume"
										replay_text="Replay" start_text="Start" stop_text="Stop"]</code>
									</pre>
									Also you can change it by filter. We prefer by filter.
									<pre>
											<code id='filter_hook'>
												{`
              add_filter( 'tta__button_text_arr', 'tta__button_text_arr_callback' );
              function tta__button_text_arr_callback ($button_text_arr) {
		// Listen button
		$text_arr['listen_text'] = 'Listen'; // paste custom text
		$text_arr['pause_text'] = 'Pause'; // paste custom text
		$text_arr['resume_text'] = 'Resume'; // paste custom text
		$text_arr['replay_text'] = 'Replay'; // paste custom text
		// Hover title
		$text_arr['listen_hover_title'] = 'test listen title',
		$text_arr['pause_hover_title'] = 'test pause title',
		$text_arr['resume_hover_title'] = 'test resume title',
		$text_arr['replay_hover_title'] = 'test replay title',

		
		return $text_arr;
              }
              `}

											</code>
										</pre>
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
																<code>{filter.arguments}</code>
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
		$text_arr['listen_text'] = 'Listen'; // paste custom text
		$text_arr['pause_text'] = 'Pause'; // paste custom text
		$text_arr['resume_text'] = 'Resume'; // paste custom text
		$text_arr['replay_text'] = 'Replay'; // paste custom text
		// Hover title
		$text_arr['listen_hover_title'] = 'test listen title',
		$text_arr['pause_hover_title'] = 'test pause title',
		$text_arr['resume_hover_title'] = 'test resume title',
		$text_arr['replay_hover_title'] = 'test replay title',
		
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
							<Accordion.Item eventKey='10'>
								<Accordion.Header>
									10. How many languages support in pro version?
								</Accordion.Header>
								<Accordion.Body>
									<strong>PRO SUPPORTED LANGUAGES:</strong><br />
									Text To Speech Pro TTS Accessibility plugin supports these languages.<br /><br />

									Afrikaans, Albanian, Arabic, Armenian, Catalan, Chinese,
									Chinese (Mandarin/China), Chinese (Mandarin/Taiwan),
									Chinese (Cantonese), Croatian, Czech, Danish, Dutch,
									English, English (Australia), English (United Kingdom),
									English (United States), Esperanto, Finnish, French, German,
									Greek, Haitian Creole, Hindi, Hungarian, Icelandic,
									Indonesian, Italian, Japanese, Korean, Latin, Latvian,
									Macedonian, Norwegian, Polish, Portuguese, Portuguese (Brazil),
									Romanian, Russian, Serbian, Slovak, Spanish, Spanish (Spain),
									Spanish (United States), Swahili, Swedish, Tamil, Thai,
									Turkish, Vietnamese, Welsh
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='11'>
								<Accordion.Header>
									11. How many languages support in free version?
								</Accordion.Header>
								<Accordion.Body>
									<strong>Free SUPPORTED LANGUAGES:</strong><br />
									Text To Speech TTS Accessibility plugin supports these languages.<br /><br />

									<strong>Chrome Desktop:</strong> UK English, US English, Spanish ( Spain ), Spanish ( United States ), French, Deutsch, Italian, Russian, Dutch, Japanese, Korean, Chinese (China), Chinese (Hong Kong), Chinese (Taiwan) Hindi, Indonesian, Polish, Brazilian Portuguese.<br />
									<strong>Chrome Mobile:</strong> English USA, English UK, German, Italian, Russian, French, Spanish<br />

									<strong>Microsoft Edge Desktop :</strong> All Languages.<br />

									<strong>Microsoft Edge Mobile :</strong> All Languages.<br />

									<strong>FireFox Desktop:</strong> English.<br />

									<strong>FireFox Mobile:</strong> English USA, English UK, German, Italian, Russian, French, Spanish.<br />
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='12'>
								<Accordion.Header>
									12. How many languages support in Pro version?
								</Accordion.Header>
								<Accordion.Body>
									Text To Speech Pro TTS Accessibility plugin supports these languages.
									<br/>
									<br/>
									Afrikaans, Albanian, Arabic, Armenian, Catalan, Chinese,
									Chinese (Mandarin/China), Chinese (Mandarin/Taiwan),
									Chinese (Cantonese), Croatian, Czech, Danish, Dutch,
									English, English (Australia), English (United Kingdom),
									English (United States), Esperanto, Finnish, French, German,
									Greek, Haitian Creole, Hindi, Hungarian, Icelandic,
									Indonesian, Italian, Japanese, Korean, Latin, Latvian,
									Macedonian, Norwegian, Polish, Portuguese, Portuguese (Brazil),
									Romanian, Russian, Serbian, Slovak, Spanish, Spanish (Spain),
									Spanish (United States), Swahili, Swedish, Tamil, Thai,
									Turkish, Vietnamese, Welsh.
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
