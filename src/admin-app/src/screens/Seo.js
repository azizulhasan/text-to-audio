/**
 * SEO & AI Search, as the free plugin shows it.
 *
 * Audio structured data (schema.org AudioObject, speakable, crawler links) is
 * part of AtlasVoice Pro, and Pro brings its own screen for this route
 * (the `atlasvoice.screens` filter). The free plugin holds no schema code,
 * no setting and no locked control: it says what the feature does and links
 * to the plans (wp.org guideline 5).
 *
 * With a Pro that does not bring the new screen yet, the settings stay in
 * reach through the classic screen.
 */
import { __ } from '@wordpress/i18n';
import { Button, Card, CardBody } from '@wordpress/components';

import { useApp } from '../app-context';
import { classicHashFor } from '../routes';
import { Empty, Pane, ProBadge, Scroll } from '../shell/parts';

/** An example of the description a search engine gets. Not translated: it is code. */
const EXAMPLE =
	'{\n  "@type": "AudioObject",\n  "name": "Listen to: How we\n   restored the old mill",\n  "duration": "PT4M5S",\n  "inLanguage": "en-GB"\n}';

/**
 * The screen.
 *
 * @return {*} SEO & AI Search.
 */
export default function Seo() {
	const { boot, go, isPro, route } = useApp();

	if ( isPro ) {
		return (
			<Pane canvas>
				<Scroll width={ 720 }>
					<Empty
						title={ __(
							'This screen is being rebuilt',
							'text-to-audio'
						) }
						action={
							<Button
								variant="secondary"
								href={
									boot.classicUrl +
									classicHashFor( route ? route.id : 'seo' )
								}
								__next40pxDefaultSize
							>
								{ __(
									'Open it in the classic screens',
									'text-to-audio'
								) }
							</Button>
						}
					>
						{ __(
							'Your settings are safe. Until this screen is ready, you can change them in the classic screens.',
							'text-to-audio'
						) }
					</Empty>
				</Scroll>
			</Pane>
		);
	}

	const points = [
		__(
			"Describes each post's MP3 to Google as an AudioObject, with its real length, language and date.",
			'text-to-audio'
		),
		__(
			'Joins the schema of Yoast SEO, Rank Math or All in One SEO, so a page never has two descriptions.',
			'text-to-audio'
		),
		__(
			'Speakable markup for Google Assistant, with CSS selectors you choose.',
			'text-to-audio'
		),
		__(
			"A plain MP3 link for AI crawlers that don't run JavaScript, such as GPTBot, ClaudeBot and PerplexityBot.",
			'text-to-audio'
		),
	];

	return (
		<Pane canvas>
			<Scroll width={ 900 }>
				<Card>
					<CardBody>
						<div className="atlasvoice-seo-hero">
							<div className="atlasvoice-seo-words">
								<h2 className="atlasvoice-card-title">
									<ProBadge />{ ' ' }
									{ __(
										'Audio in search results and AI answers',
										'text-to-audio'
									) }
								</h2>
								<p className="atlasvoice-seo-lead">
									{ __(
										"AtlasVoice Pro adds the structured data search engines and AI assistants read for your posts' MP3 audio:",
										'text-to-audio'
									) }
								</p>
								<ul className="atlasvoice-list">
									{ points.map( ( point ) => (
										<li key={ point }>{ point }</li>
									) ) }
								</ul>
								<Button
									variant="primary"
									onClick={ () => go( 'account:plans' ) }
									__next40pxDefaultSize
								>
									{ __( 'See plans', 'text-to-audio' ) }
								</Button>
							</div>
							<figure className="atlasvoice-seo-example">
								<figcaption className="atlasvoice-weak">
									{ __(
										'An example of what search engines get',
										'text-to-audio'
									) }
								</figcaption>
								<pre className="atlasvoice-code">
									{ EXAMPLE }
								</pre>
							</figure>
						</div>
					</CardBody>
				</Card>
			</Scroll>
		</Pane>
	);
}
