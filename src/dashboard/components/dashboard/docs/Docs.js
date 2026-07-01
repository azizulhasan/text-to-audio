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
		{ name: 'tts_is_secondary_loop', arguments: '$is_secondary, $current_id, $queried_id' },
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

						<Accordion.Item eventKey="8">
							<Accordion.Header>
								{__('8. Scripts blocked by CORS policy when using a CDN (WP Rocket / RocketCDN / Cloudflare / BunnyCDN)', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									<strong>{__('Symptom:', 'text-to-audio')}</strong>{' '}
									{__("The browser console shows errors like “Access to script at '…rocketcdn.me/…/text-to-audio-pro-button.min.js' from origin '…' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.” The player never loads.", 'text-to-audio')}
								</p>
								<p>
									<strong>{__('Why this happens:', 'text-to-audio')}</strong>{' '}
									{__("Your CDN is serving our plugin's JavaScript files, but your origin server isn't sending an Access-Control-Allow-Origin header. CDNs are pull caches — they only return what the origin gives them. When WP Rocket's Delay JavaScript (or a similar optimizer) adds a crossorigin attribute to the script tag, the browser then enforces CORS and blocks the load. This is a server configuration on your site, not a plugin bug.", 'text-to-audio')}
								</p>
								<p>
									<strong>{__('Fix — Apache (.htaccess):', 'text-to-audio')}</strong>{' '}
									{__('Add the block below to the .htaccess in your WordPress root (same folder as wp-config.php), above the # BEGIN WP Rocket and # BEGIN WordPress sections.', 'text-to-audio')}
								</p>
								<pre>
									<code>{`<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2?|ttf|eot|svg|otf)$">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
  </FilesMatch>
</IfModule>`}</code>
								</pre>
								<p>
									<strong>{__('Fix — nginx:', 'text-to-audio')}</strong>{' '}
									{__('Add this location block inside your server {} block, then reload nginx (sudo nginx -s reload).', 'text-to-audio')}
								</p>
								<pre>
									<code>{`location ~* \\.(js|css|woff2?|ttf|eot|svg|otf)$ {
  add_header Access-Control-Allow-Origin "*" always;
  add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
}`}</code>
								</pre>
								<p>
									<strong>{__('Then — purge your CDN cache:', 'text-to-audio')}</strong>{' '}
									{__('WP Rocket → Settings → CDN → Clear all cache files. (Or purge from your CDN dashboard directly.) Until you purge, the CDN keeps serving the old response without the new header.', 'text-to-audio')}
								</p>
								<p>
									<strong>{__('Verify:', 'text-to-audio')}</strong>{' '}
									{__('Run this in a terminal and confirm access-control-allow-origin: * appears in the response headers:', 'text-to-audio')}
								</p>
								<pre>
									<code>{`curl -I https://your-site.com/wp-content/plugins/text-to-audio/admin/js/build/TextToSpeech.min.js`}</code>
								</pre>
								<p>
									<strong>{__('Optional:', 'text-to-audio')}</strong>{' '}
									{__('If you\'d rather avoid CORS altogether, exclude our plugin\'s script handles (text-to-audio-*, plyr) from WP Rocket → File Optimization → Delay JavaScript execution. That prevents the crossorigin attribute from being added in the first place. Fixing the header is still the more durable solution.', 'text-to-audio')}
								</p>
								<p>
									<a href="https://atlasaidev.com/docs/text-to-speech/faq/cors-cdn-errors/" target="_blank" rel="noreferrer">
										{__('Read the full guide on atlasaidev.com →', 'text-to-audio')}
									</a>
								</p>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey="9">
							<Accordion.Header>
								{__('9. The player or markers are missing inside post cards, related posts or widgets', 'text-to-audio')}
							</Accordion.Header>
							<Accordion.Body>
								<p>
									{__('By default the player button and the AtlasVoice markers/wrapper are emitted only on the main content of the post or page being viewed — never inside a secondary loop such as an Avada "Post Cards" grid, a "Related Posts" block, or a widget. This is intentional: it prevents the content wrapper from being injected into your theme\'s grid markup and breaking the layout.', 'text-to-audio')}
								</p>
								<p>
									{__('If you deliberately want the player to render inside a secondary loop, override the tts_is_secondary_loop filter. It receives the computed boolean, the current loop post ID, and the queried object ID.', 'text-to-audio')}
								</p>
								<p>
									<strong>{__('Allow the player everywhere, including post cards:', 'text-to-audio')}</strong>
								</p>
								<pre>
									<code>{`add_filter( 'tts_is_secondary_loop', '__return_false' );`}</code>
								</pre>
								<p>
									<strong>{__('Allow it only for a specific post type:', 'text-to-audio')}</strong>
								</p>
								<pre>
									<code>{`add_filter( 'tts_is_secondary_loop', function ( $is_secondary, $current_id, $queried_id ) {
    if ( get_post_type( $current_id ) === 'product' ) {
        return false; // always emit for products, even in sub-loops
    }
    return $is_secondary;
}, 10, 3 );`}</code>
								</pre>
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
