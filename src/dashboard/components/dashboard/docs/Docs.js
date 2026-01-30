import React from 'react';
import { __ } from '@wordpress/i18n';
import { Accordion, Table, Container, Row, Col } from 'react-bootstrap';
import toast from '../../context/Notify';
import { copyToClipBoard } from '../../context/utilities';
import UpgradeToPro from '../../UpgradeToPro';

export default function Docs() {

	const filters = [
		{ name: 'tta__content_title', arguments: '$title, $post' },
		{ name: 'tta__content_description', arguments: '$description_sanitized, $description, $post_id, $post' },
		{ name: 'tta__button_text_arr', arguments: '$text_arr, $atts, $content_read_time' },
		{ name: 'tta_clean_content', arguments: '$text' },
		{ name: 'tts__listening_button', arguments: '$button, $btn_no, $class, $post' },
		{ name: 'tts_player_customizations', arguments: '$player_icons' },
	];

	const pro_filters = [
		{ name: 'tts_clean_gtts_folder', arguments: '$should_delete_mp3_folder' },
		{ name: 'tts_pro_batch_charlen', arguments: '$charlen_arr' },
		{ name: 'tts_pro_exclude_between_delimiters', arguments: '$delimiters_arr' },
	];

	const js_free_filters = [
		{ name: 'tta__settings_stop_auto_pause_after_switching_tab', arguments: 'true' },
	];

	const js_pro_filters = [
		{ name: 'ttsProPlayerOptions', arguments: 'obj' },
		{ name: 'ttsProLink', arguments: 'link' },
		{ name: 'ttsSetSelectedLanguageFromDom', arguments: 'false' },
		{ name: 'ttsProApplyNumberFormat', arguments: 'false' },
		{ name: 'ttsProGetContentFromDOM', arguments: 'true' },
		{ name: 'ttsProPlayerDesign', arguments: 'obj' },
	];

	return (
		<Container>
			<Row>
				<Col xs={12} lg={8}>
					<Accordion>

						<Accordion.Item eventKey="1">
							<Accordion.Header>
								{__('1. Browser support issues on Android and desktop', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('This plugin is built using the browser SpeechSynthesis API. No external API is used.', 'text-to-audio')}
								</p>
								<p>
									<a href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis" target="_blank" rel="noreferrer">
										{__('View SpeechSynthesis documentation', 'text-to-audio')}
									</a>
								</p>
								<p>
									{__('Browser and device support varies, so available voices and languages may differ between desktop and mobile devices.', 'text-to-audio')}
								</p>
								<p>
									<a href="https://atlasaidev.com/contact-us/" target="_blank" rel="noreferrer">
										{__('Submit a support ticket', 'text-to-audio')}
									</a>
								</p>
								<p>
									{__('There are no browser limitations in the Pro version.', 'text-to-audio')}
								</p>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="2">
							<Accordion.Header>
								{__('2. Different voices or languages on mobile', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('SpeechSynthesis support varies between browsers and devices. Some voices may be available on desktop but not on mobile.', 'text-to-audio')}
								</p>
								<p>
									{__('The Pro version does not have these limitations.', 'text-to-audio')}
								</p>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="3">
							<Accordion.Header>
								{__('3. Can I exclude certain words from playback?', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('Yes. You can exclude specific words or phrases in the Pro version.', 'text-to-audio')}
								</p>
								<p>
									{__('Use the pipe (|) symbol to separate multiple words or phrases.', 'text-to-audio')}
								</p>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="4">
							<Accordion.Header>
								{__('4. Can I exclude specific HTML tags from playback?', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('The Pro version allows excluding content wrapped in specific HTML tags.', 'text-to-audio')}
								</p>
								<p>
									{__('Use the pipe (|) symbol to exclude multiple tags.', 'text-to-audio')}
								</p>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="5">
							<Accordion.Header>
								{__('5. How can I change button text?', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('Button text can be changed using shortcode attributes or filters. Filters always override shortcode values.', 'text-to-audio')}
								</p>
								<pre>
									<code>
										[atlasvoice listen_text="Listen" pause_text="Pause" resume_text="Resume"]
									</code>
								</pre>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="6">
							<Accordion.Header>
								{__('6. How do I add a custom CSS class to the button?', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<code>[atlasvoice className="custom_class"]</code>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="7">
							<Accordion.Header>
								{__('7. Backend filters (Free version)', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<Table striped bordered size="sm">
									<thead>
									<tr>
										<th>{__('Filter', 'text-to-audio')}</th>
										<th>{__('Arguments', 'text-to-audio')}</th>
									</tr>
									</thead>
									<tbody>
									{filters.map(filter => (
										<tr key={filter.name}>
											<td><code>{filter.name}</code></td>
											<td><code>{filter.arguments}</code></td>
										</tr>
									))}
									</tbody>
								</Table>
							</Accordion.Body>
						</Accordion.Item>

					</Accordion>
				</Col>

				<Col xs={12} lg={4}>
					<UpgradeToPro />
				</Col>
			</Row>
		</Container>
	);
}
