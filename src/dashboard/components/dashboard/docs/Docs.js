import React from 'react';
import { __ } from '@wordpress/i18n';
import { Accordion, Table, Container, Row, Col } from 'react-bootstrap';
import toast from '../../context/Notify';
import { copyToClipBoard } from '../../context/utilities';
import UpgradeToPro from '../../UpgradeToPro';
export default function Docs() {
	/**
	 * Filters
	 */
	const filters = [
		{
			name: 'tta__content_title',
			arguments: '$title, $post',
		},
		{
			name: 'tta__content_description',
			arguments: '$description_sanitized, $description, $post_id, $post',
		},
		{
			name: 'tta__button_text_arr',
			arguments: '$text_arr, $atts, $content_read_time'
		},
		{
			name: 'tta_clean_content',
			arguments: '$text'
		},
		{
			name: 'tts__listening_button',
			arguments: '$button, $btn_no, $class, $post'
		},
		{
			name: 'tts_player_customizations',
			arguments: '$player_icons'
		},

	];

	/**
	 * Filters
	 */
	const pro_filters = [
		{
			name: 'tts_clean_gtts_folder',
			arguments: '$should_delete_mp3_folder',
		},
		{
			name: 'tts_pro_batch_charlen',
			arguments: '$charlen_arr',
		},
		{
			name: 'tts_pro_exclude_between_delimiters',
			arguments: '$delimiters_arr',
		},
	];

	/**
	 *  JS pro Filters
	 */
	const js_free_filters = [
		{
			name: 'tta__settings_stop_auto_pause_after_switching_tab',
			arguments: 'true',
		},
	];

	/**
	 *  JS pro Filters
	 */
	const js_pro_filters = [
		{
			name: 'ttsProPlayerOptions',
			arguments: 'obj',
		},
		{
			name: 'ttsProLink',
			arguments: 'link',
		},
		{
			name: 'ttsSetSelectedLanguageFromDom',
			arguments: 'false',
		},
		{
			name: 'ttsProApplyNumberFormat',
			arguments: 'false',
		},
		{
			name: 'ttsProGetContentFromDOM',
			arguments: 'true',
		},
		{
			name: 'ttsProPlayerDesign',
			arguments: 'obj',
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
									{__("1. Browser support issue on android phone and desktop","text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									{__("This plugin is built on browser API. No external API is used. Here is the API used", "text-to-audio")} <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' >{__("speechSynthesis", "text-to-audio")}</a>
									{__("That is why it doesn’t support all android phones here you can check which android phone support this", "text-to-audio")} <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis#browser_compatibility'>{__("speechSynthesis", "text-to-audio")}</a> {__("API", "text-to-audio")}


									<br /><br />
									{__("Another issue speechSynthesis API is differ browser to browser also divice to divice . So it changes the voices and languages based on browser. one language may available on desktopIt can be not available on mobile phone. One voice may available on desktop, it may be not available on android.", "text-to-audio")}

									<br /><br />{__("If you still facing problems regarding browser issues please on a", "text-to-audio")} <a target='_blank' href='http://atlasaidev.com/contact-us/'>{__("ticket", "text-to-audio")}</a>.
									<br /><br /> {__("There is no issue related to browser on", "text-to-audio")} <a target='_blank' href='https://atlasaidev.com/text-to-speech-pro/'>{__("pro version.", "text-to-audio")}</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='2'>
								<Accordion.Header>
									{__("2. Another voice language on mobile", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									{__("This plugin is built on browser API", "text-to-audio")} <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' >{__("speechSynthesis", "text-to-audio")}</a>.
									<br />{__("speechSynthesis API is differ browser to browser also divice to divice . So it changes the voices and languages based on browser. one language may available on desktop It can be not available on mobile phone. One voice may available on desktop, it may be not available on android.", "text-to-domain")}
									<br /><br /> {__("There is no issue releated to voices on", "text-to-audio")} <a target='_blank' href='https://atlasaidev.com/text-to-speech-pro/'>{__("pro version.", "text-to-audio")}</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='3'>
								<Accordion.Header>
									{__("3. Can I Restrict/Exclude Certain Words From Playing?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<p>
										{__("Absolutely! You have the flexibility to exclude specific content from being read aloud, and this feature is available in the", "text-to-audio")} <a target='_blank'
											href='https://atlasaidev.com/text-to-speech-pro/'>{__("pro version.", "text-to-audio")}</a> {__("of Text to Speech.", "text-to-audio")}
									</p>
									<p>
										{__("Here’s how to exclude words from playback:", "text-to-audio")}
									</p>

									<p>{__("Navigate to the Settings tab of Text to Speech Pro.", "text-to-audio")}</p>

									<p>{__("Look for the “Exclude Texts To Speak” textarea.", "text-to-audio")}</p>
									<p>
										{__("In this field, you can list the words or phrases you wish to exclude from being read aloud.", "text-to-audio")}
									</p>
									<p>
										{__("If you want to exclude multiple words or phrases, simply separate them using the pipe symbol (|).", "text-to-audio")}
									</p>
									<p>
										{__("With this capability, you can fine-tune the playback experience, ensuring that only the desired content is read aloud to your audience.", "text-to-audio")}
									</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='4'>
								<Accordion.Header>
									{__("4. Is it possible to exclude specific HTML tags from being read aloud by the Text to Speech plugin?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<p>
										{__("Of course! With the", "text-to-audio")} <a target='_blank'
											href='https://atlasaidev.com/text-to-speech-pro/'>{__("pro version.", "text-to-audio")}</a> {__("of Text to Speech, you gain the ability to skip the content enclosed within certain HTML tags during playback.", "text-to-audio")}
									</p>
									<p>
										{__("**Here's how it works:**", 'text-to-audio')}
									</p>
									<p>
										{__('*Navigate to the Settings tab of Text to Speech Pro.', 'text-to-audio')}
									</p>
									<p>
										{__('*Locate the "Exclude Tag\'s Content" textarea.', 'text-to-audio')}
									</p>
									<p>
										  {__(
    '*In this field, you can specify the HTML tags whose content you want to exclude from being read aloud.',
    'text-to-audio'
  )}
									</p>
									<p>
										  {__(
    '*If you need to skip multiple tags, simply separate them using the pipe symbol (|).',
    'text-to-audio'
  )}
									</p>
									<p>
										  {__(
    'By utilizing this feature, you can tailor the reading experience to your preferences, ensuring that specific HTML elements are omitted from the audio playback.',
    'text-to-audio'
  )}
									</p>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='5'>
								<Accordion.Header>
									{__("5. How to change button text?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
  {__(
    'You can change button text 2 ways: one is by shortcode attribute. Another way is adding a filter. But filter always overrides the shortcode attributes. Here is a shortcode example:',
    'text-to-audio'
  )}
									<pre>
										<code>[atlasvoice listen_text="Listen" pause_text="Pause" resume_text="Resume"
											replay_text="Replay" start_text="Start" stop_text="Stop"]</code>
									</pre>
									{__('Also, you can change it by filter. We prefer by filter.', 'text-to-audio')}
									<pre>
										<code id='filter_hook'>
											{`
	add_filter('tta__button_text_arr', 'tta__button_text_arr_callback');
	function tta__button_text_arr_callback($text_arr) {
		return [
			'listen_text' => 'Listen',
			'pause_text'  => 'Pause',
			'resume_text' => 'Resume',
			'replay_text' => 'Replay',
			'listen_hover_title' => 'listen title',
			'pause_hover_title' => 'pause title',
			'resume_hover_title' => 'resume title',
			'replay_hover_title' => 'replay title',
		];
	}
              `}

										</code>
									</pre>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='6'>
								<Accordion.Header>
									{__("6. How to add custom css class to button?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									{__("Add class on shortcode as an attribute. Example :{' '}", "text-to-audio")}
									<code>[atlasvoice className="custom_class"]</code>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='7'>
								<Accordion.Header>
									{__("7. Apply Backend Filters and Actions ( Free Version )", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<Table striped bordered hover size='sm'>
										<thead>
											<tr>
												<th>{__('Sr.', 'text-to-audio')}</th>

												<th>{__('Filter Name', 'text-to-audio')}</th>
												<th>{__('Arguments', 'text-to-audio')}</th>
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
									{__("visit examples", "text-to-audio")} <a href={'https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-backend-filters-and-actions/'} target={'_blank'}>{__("here", "text-to-audio")}</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='8'>
								<Accordion.Header>{__("8. How to apply filters.", "text-to-audio")}</Accordion.Header>
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
										{__("Install the plugin", "text-to-audio")} <a href='https://wordpress.org/plugins/code-snippets/' target={'_blank'}>{__("Code Snippets", "text-to-audio")}</a>
										{__("Then Select Snippet {'>'} Add New Create a new snippet with this block of code", "text-to-audio")}
										<pre>
											<code id='filter_hook'>
												{`
	add_filter('tta__button_text_arr', 'tta__button_text_arr_callback');
	function tta__button_text_arr_callback($text_arr) {
		return [
			'listen_text' => 'Listen',
			'pause_text'  => 'Pause',
			'resume_text' => 'Resume',
			'replay_text' => 'Replay',
			'listen_hover_title' => 'listen title',
			'pause_hover_title' => 'pause title',
			'resume_hover_title' => 'resume title',
			'replay_hover_title' => 'replay title',
		];
	}
              `}
											</code>
										</pre>
									</div>
								</Accordion.Body>
							</Accordion.Item>

							<Accordion.Item eventKey='9'>
								<Accordion.Header>
									{__("9. What is the name of the block button?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<strong>{__("Customize Button", "text-to-audio")}</strong>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='10'>
								<Accordion.Header>
									{__("10. How many languages support in pro version?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<strong>{__("PRO SUPPORTED LANGUAGES:", "text-to-audio")}</strong><br />
									{__("Text To Speech Pro TTS Accessibility plugin supports these languages.", "text-to-audio")}<br /><br />

{__('Afrikaans, Albanian, Arabic, Armenian, Catalan, Chinese, Chinese (Mandarin/China), Chinese (Mandarin/Taiwan), Chinese (Cantonese), Croatian, Czech, Danish, Dutch, English, English (Australia), English (United Kingdom), English (United States), Esperanto, Finnish, French, German, Greek, Haitian Creole, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Korean, Latin, Latvian, Macedonian, Norwegian, Polish, Portuguese, Portuguese (Brazil), Romanian, Russian, Serbian, Slovak, Spanish, Spanish (Spain), Spanish (United States), Swahili, Swedish, Tamil, Thai, Turkish, Vietnamese, Welsh', 'text-to-audio')}
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='11'>
								<Accordion.Header>
									{__("11. How many languages support in free version?", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<strong>{__("Free SUPPORTED LANGUAGES:", "text-to-audio")}</strong><br />
									{__("Text To Speech TTS Accessibility plugin supports these languages.", "text-to-audio")}<br /><br />

									<strong>{__("Chrome Desktop:", "text-to-audio")}</strong>{__("UK English, US English, Spanish ( Spain ), Spanish ( United States ), French, Deutsch, Italian, Russian, Dutch, Japanese, Korean, Chinese (China), Chinese (Hong Kong), Chinese (Taiwan) Hindi, Indonesian, Polish, Brazilian Portuguese.", "text-to-audio")}<br />
									<strong>{__("Chrome Mobile:", "text-to-audio")}</strong>{__("English USA, English UK, German, Italian, Russian, French, Spanish", "text-to-audio")} <br />

									<strong>{__("Microsoft Edge Desktop :", "text-to-audio")}</strong> {__("All Languages.", "text-to-audio")}<br />

									<strong>{__("Microsoft Edge Mobile :", "text-to-audio")}</strong> {__("All Languages.", "text-to-audio")}<br />

									<strong>{__("FireFox Desktop:", "text-to-audio")}</strong> {__("English.", "text-to-audio")}<br />

									<strong>{__("FireFox Mobile:", "text-to-audio")}</strong> {__("English USA, English UK, German, Italian, Russian, French, Spanish.", "text-to-audio")}<br />
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='12'>
								<Accordion.Header>
									{__("12. Apply Backend Filters and Actions ( Pro Version )", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<Table striped bordered hover size='sm'>
										<thead>
											<tr>
												<th>{__('Sr.', 'text-to-audio')}</th>

												<th>{__('Filter Name', 'text-to-audio')}</th>
												<th>{__('Arguments', 'text-to-audio')}</th>
											</tr>
										</thead>
										<tbody>
											{pro_filters.length &&
												pro_filters.map((filter, index) => {
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
										{__("visit examples", "text-to-audio")} <a href={'https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-backend-filters-and-actions-pro-version/'} target={'_blank'}>{__("here", "text-to-audio")}</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='13'>
								<Accordion.Header>
									{__("13. Apply Frontend Filters and Actions ( Free Version )", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<Table striped bordered hover size='sm'>
										<thead>
											<tr>
												<th>{__('Sr.', 'text-to-audio')}</th>

												<th>{__('Filter Name', 'text-to-audio')}</th>
												<th>{__('Arguments', 'text-to-audio')}</th>
											</tr>
										</thead>
										<tbody>
											{js_free_filters.length &&
												js_free_filters.map((filter, index) => {
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
										{__("visit examples", "text-to-audio")} <a href={'https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-frontend-filters-and-actions-free-version/'} target={'_blank'}>{__("here", "text-to-audio")}</a>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey='14'>
								<Accordion.Header>
									{__("14. Apply Frontend Filters and Actions ( Pro Version )", "text-to-audio")}
								</Accordion.Header>
								<Accordion.Body>
									<Table striped bordered hover size='sm'>
										<thead>
											<tr>
												<th>{__('Sr.', 'text-to-audio')}</th>

												<th>{__('Filter Name', 'text-to-audio')}</th>
												<th>{__('Arguments', 'text-to-audio')}</th>
											</tr>
										</thead>
										<tbody>
											{js_pro_filters.length &&
												js_pro_filters.map((filter, index) => {
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
									{__("visit examples", "text-to-audio")} <a href={'https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-frontend-filters-and-actions-pro-version/'} target={'_blank'}>{__("here", "text-to-audio")}</a>
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
