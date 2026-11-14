/**
 * Help › Documentation.
 *
 * Every guide of the plugin in one place: pick a topic, read its steps, open
 * the full guide or the video. The topics are the ones the "How to" drawer
 * shows (TTA\Help\Help_Topics, printed with the page), so nothing is
 * fetched. Guides, videos and the contact form open in a new tab and are
 * never embedded: nothing is loaded from another site until a click.
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, CardBody, SearchControl } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

import { useApp } from '../app-context';
import { safeLink } from '../help/topics';
import { AppIcon, Empty, Pane, ProBadge, Scroll } from '../shell/parts';

/**
 * The topics a site can use, as a list.
 *
 * @param {Object}  topics Topics keyed by route id (boot.helpTopics).
 * @param {boolean} isPro  Whether Pro is active.
 * @return {Array} [ { key, title, steps, … } ], without Pro's topics on a free site.
 */
export function listTopics( topics, isPro ) {
	return Object.keys( topics || {} )
		.map( ( key ) => ( { key, ...topics[ key ] } ) )
		.filter( ( topic ) => topic.title && ( isPro || ! topic.pro ) );
}

/**
 * The topics that hold the words typed in the search box.
 *
 * @param {Array}  list  Topics.
 * @param {string} query What was typed.
 * @return {Array} The matching topics, all of them for an empty search.
 */
export function findTopics( list, query ) {
	const wanted = String( query || '' )
		.trim()
		.toLowerCase();
	if ( ! wanted ) {
		return list;
	}

	return list.filter( ( topic ) =>
		[ topic.title, ...( Array.isArray( topic.steps ) ? topic.steps : [] ) ]
			.join( ' ' )
			.toLowerCase()
			.includes( wanted )
	);
}

/**
 * The screen.
 *
 * @return {*} Help › Documentation.
 */
export default function HelpDocs() {
	const { boot, isPro } = useApp();
	const [ query, setQuery ] = useState( '' );
	const [ chosen, setChosen ] = useState( '' );
	const all = useMemo(
		() => listTopics( boot.helpTopics, isPro ),
		[ boot.helpTopics, isPro ]
	);
	const found = findTopics( all, query );
	const topic = found.find( ( item ) => item.key === chosen ) || found[ 0 ];
	const docsUrl = safeLink( boot.docsUrl );
	const supportUrl = safeLink( boot.supportUrl );

	const support = supportUrl && (
		<Card className="atlasvoice-section">
			<CardBody>
				<h2 className="atlasvoice-card-title">
					{ __( 'Still stuck?', 'text-to-audio' ) }
				</h2>
				<p className="atlasvoice-weak">
					{ __(
						'We usually answer within one working day. The contact form opens atlasaidev.com in a new tab.',
						'text-to-audio'
					) }
				</p>
				<div className="atlasvoice-actions">
					<Button
						variant="secondary"
						href={ supportUrl }
						target="_blank"
						rel="noreferrer"
						icon={ <AppIcon name="external" /> }
						__next40pxDefaultSize
					>
						{ __( 'Contact support', 'text-to-audio' ) }
					</Button>
				</div>
			</CardBody>
		</Card>
	);

	if ( ! all.length ) {
		return (
			<Pane canvas>
				<Scroll width={ 900 }>
					<Card>
						<Empty
							title={ __(
								'No guides here yet',
								'text-to-audio'
							) }
							action={
								docsUrl && (
									<Button
										variant="primary"
										href={ docsUrl }
										target="_blank"
										rel="noreferrer"
										__next40pxDefaultSize
									>
										{ __(
											'Open the documentation',
											'text-to-audio'
										) }
									</Button>
								)
							}
						>
							{ __(
								'The full documentation is on atlasaidev.com. It opens in a new tab.',
								'text-to-audio'
							) }
						</Empty>
					</Card>
					{ support }
				</Scroll>
			</Pane>
		);
	}

	const steps = topic && Array.isArray( topic.steps ) ? topic.steps : [];
	const guideUrl = topic ? safeLink( topic.docUrl ) || docsUrl : '';
	const videoUrl = topic ? safeLink( topic.videoUrl ) : '';

	return (
		<Pane canvas>
			<Scroll width={ 1080 }>
				<div className="atlasvoice-docs">
					<nav
						className="atlasvoice-docs-side"
						aria-label={ __( 'Guides', 'text-to-audio' ) }
					>
						<SearchControl
							__nextHasNoMarginBottom
							label={ __( 'Search the help', 'text-to-audio' ) }
							placeholder={ __(
								'Search the help',
								'text-to-audio'
							) }
							value={ query }
							onChange={ setQuery }
						/>
						{ found.length ? (
							<ul className="atlasvoice-docs-list">
								{ found.map( ( item ) => (
									<li
										key={ item.key }
										className="atlasvoice-docs-entry"
									>
										<button
											type="button"
											className={
												'atlasvoice-docs-item' +
												( topic &&
												item.key === topic.key
													? ' is-current'
													: '' )
											}
											aria-current={
												topic && item.key === topic.key
													? 'true'
													: undefined
											}
											onClick={ () =>
												setChosen( item.key )
											}
										>
											{ item.title }
										</button>
									</li>
								) ) }
							</ul>
						) : (
							<p className="atlasvoice-weak" role="status">
								{ __(
									'No guide matches this.',
									'text-to-audio'
								) }
							</p>
						) }
					</nav>

					<div className="atlasvoice-docs-main">
						{ topic && (
							<Card>
								<CardBody>
									<article
										className="atlasvoice-docs-article"
										aria-labelledby="atlasvoice-docs-title"
									>
										<h2
											id="atlasvoice-docs-title"
											className="atlasvoice-card-title"
										>
											{ topic.title }
											{ topic.pro && (
												<>
													{ ' ' }
													<ProBadge />
												</>
											) }
										</h2>
										{ steps.length > 0 && (
											<>
												<p className="atlasvoice-weak">
													{ sprintf(
														/* translators: %d: number of steps. */
														__(
															'Do it in %d steps',
															'text-to-audio'
														),
														steps.length
													) }
												</p>
												<ol className="atlasvoice-help-steps">
													{ steps.map( ( step ) => (
														<li key={ step }>
															{ step }
														</li>
													) ) }
												</ol>
											</>
										) }
										<div className="atlasvoice-actions">
											{ guideUrl && (
												<Button
													variant="primary"
													href={ guideUrl }
													target="_blank"
													rel="noreferrer"
													icon={
														<AppIcon name="external" />
													}
													__next40pxDefaultSize
												>
													{ __(
														'Read the guide',
														'text-to-audio'
													) }
												</Button>
											) }
											{ videoUrl && (
												<Button
													variant="secondary"
													href={ videoUrl }
													target="_blank"
													rel="noreferrer"
													__next40pxDefaultSize
												>
													{ topic.videoLength
														? sprintf(
																/* translators: %s: length of a video, e.g. 2:00. */
																__(
																	'Watch the video (%s)',
																	'text-to-audio'
																),
																topic.videoLength
														  )
														: __(
																'Watch the video',
																'text-to-audio'
														  ) }
												</Button>
											) }
										</div>
										<p className="atlasvoice-weak">
											{ __(
												'The guide opens atlasaidev.com in a new tab.',
												'text-to-audio'
											) }
										</p>
									</article>
								</CardBody>
							</Card>
						) }
						{ support }
					</div>
				</div>
			</Scroll>
		</Pane>
	);
}
