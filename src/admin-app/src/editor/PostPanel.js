/**
 * The "AtlasVoice" panel of the post editor (TTS-347).
 *
 * One panel for the block editor (in its own sidebar) and the Classic
 * Editor (in a box): the audio of this post, whether the player shows on
 * it, how much it was listened to, and the shortcode.
 *
 * It is for everyone who can edit the post, so it talks to
 * tta/v1/post-panel/<id> and not to the settings routes. Nothing new is
 * stored: hiding the player adds the post to the list the "What is read"
 * screen keeps, and making audio starts the job the Audio library starts.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button,
	Notice,
	PanelBody,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';

/** How often a post whose audio is being made is asked about again. */
export const POLL_MS = 5000;

/**
 * The state of a post's audio, in a word or two.
 *
 * @param {string} status ready, outdated, making, failed, missing or draft.
 * @return {string} The words.
 */
export function statusWords( status ) {
	switch ( status ) {
		case 'ready':
			return __( 'Ready', 'text-to-audio' );
		case 'outdated':
			return __( 'Outdated', 'text-to-audio' );
		case 'making':
			return __( 'Being made', 'text-to-audio' );
		case 'failed':
			return __( 'Failed', 'text-to-audio' );
		case 'draft':
			return __( 'Draft', 'text-to-audio' );
		default:
			return __( 'No audio yet', 'text-to-audio' );
	}
}

/**
 * When the site makes audio, as the end of a sentence.
 *
 * @param {string} when play or publish.
 * @return {string} The words.
 */
export function whenWords( when ) {
	return when === 'publish'
		? __( 'right after you publish.', 'text-to-audio' )
		: __( 'the first time someone plays it.', 'text-to-audio' );
}

/**
 * What to say about the audio of a post.
 *
 * @param {Object} audio The audio part of the panel.
 * @return {string} One or two sentences.
 */
export function audioWords( audio ) {
	if ( audio.kind === 'browser' ) {
		return __(
			'The browser voice reads this post live in the visitor’s browser, so there are no audio files to make.',
			'text-to-audio'
		);
	}
	if ( audio.status === 'draft' ) {
		return (
			__(
				'Drafts never make audio. Audio is made from the published page,',
				'text-to-audio'
			) +
			' ' +
			whenWords( audio.kind === 'jobs' ? audio.when : 'play' )
		);
	}
	if ( audio.kind === 'files' ) {
		return audio.status === 'ready' || audio.status === 'outdated'
			? __(
					'This post has audio. Its files are in the box “AtlasVoice audio”.',
					'text-to-audio'
			  )
			: __(
					'The audio of this post is made the first time someone plays it.',
					'text-to-audio'
			  );
	}

	switch ( audio.status ) {
		case 'ready':
			return __(
				'The audio is up to date with the text.',
				'text-to-audio'
			);
		case 'outdated':
			return __(
				'The text changed since the audio was made. Visitors still hear the old version.',
				'text-to-audio'
			);
		case 'making':
			return audio.job && audio.job.parts > 0
				? sprintf(
						/* translators: 1: parts that are finished, 2: all parts. */
						__(
							'Part %1$d of %2$d is done. It runs on the server; nobody has to keep this page open.',
							'text-to-audio'
						),
						audio.job.parts_done,
						audio.job.parts
				  )
				: __(
						'Started. It runs on the server; nobody has to keep this page open.',
						'text-to-audio'
				  );
		case 'failed':
			return audio.job && audio.job.error
				? audio.job.error
				: __( 'The last try did not finish.', 'text-to-audio' );
		default:
			return (
				__( 'It is made', 'text-to-audio' ) +
				' ' +
				whenWords( audio.when )
			);
	}
}

/**
 * The panel.
 *
 * @param {Object} props
 * @param {Object} props.boot    { restUrl, restNonce, postId, appUrl }.
 * @param {number} props.refresh Changes when the post was saved: read again.
 * @return {*} The panel.
 */
export default function PostPanel( { boot, refresh = 0 } ) {
	const route = 'tta/v1/post-panel/' + boot.postId;
	const [ panel, setPanel ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ busy, setBusy ] = useState( '' );
	const [ message, setMessage ] = useState( null );

	const load = useCallback( async () => {
		try {
			setPanel( await request( boot, route ) );
			setFailure( '' );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot, route ] );

	useEffect( () => {
		load();
	}, [ load, refresh ] );

	// A job runs on the server: ask now and then until it has ended.
	const making = panel?.audio?.status === 'making';
	useEffect( () => {
		if ( ! making ) {
			return undefined;
		}
		const timer = setInterval( load, POLL_MS );

		return () => {
			clearInterval( timer );
			// "Started" is no longer news once the job has ended.
			setMessage( ( current ) =>
				current && current.started ? null : current
			);
		};
	}, [ making, load ] );

	const act = async ( what, path, data, done ) => {
		setBusy( what );
		setMessage( null );
		try {
			setPanel( await request( boot, path, { method: 'POST', data } ) );
			setMessage( {
				status: 'success',
				text: done,
				started: what === 'audio',
			} );
		} catch ( error ) {
			setMessage( { status: 'error', text: error.message } );
		}
		setBusy( '' );
	};

	const copy = async () => {
		try {
			await window.navigator.clipboard.writeText( panel.shortcode );
			setMessage( {
				status: 'success',
				text: __( 'Shortcode copied.', 'text-to-audio' ),
			} );
		} catch ( error ) {
			setMessage( {
				status: 'error',
				text: __(
					'It could not be copied. Select the shortcode and copy it yourself.',
					'text-to-audio'
				),
			} );
		}
	};

	if ( ! panel && ! failure ) {
		return (
			<div className="atlasvoice-editor-panel">
				<p className="atlasvoice-editor-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</p>
			</div>
		);
	}

	if ( ! panel ) {
		return (
			<div className="atlasvoice-editor-panel">
				<Notice
					status="error"
					isDismissible={ false }
					actions={ [
						{
							label: __( 'Try again', 'text-to-audio' ),
							onClick: load,
						},
					] }
				>
					{ sprintf(
						/* translators: %s: error message from the site. */
						__(
							'AtlasVoice could not be loaded for this post: %s',
							'text-to-audio'
						),
						failure
					) }
				</Notice>
			</div>
		);
	}

	const { audio, listening } = panel;
	const link = ( hash ) => ( boot.appUrl ? boot.appUrl + hash : '' );
	let makeLabel = __( 'Make audio now', 'text-to-audio' );
	if ( audio.status === 'ready' || audio.status === 'outdated' ) {
		makeLabel = __( 'Make again', 'text-to-audio' );
	} else if ( audio.status === 'failed' ) {
		makeLabel = __( 'Try again', 'text-to-audio' );
	}

	return (
		<div className="atlasvoice-editor-panel">
			{ message && (
				<Notice
					status={ message.status }
					onRemove={ () => setMessage( null ) }
				>
					{ message.text }
				</Notice>
			) }
			<PanelBody title={ __( 'Audio', 'text-to-audio' ) } initialOpen>
				{ audio.kind !== 'browser' && (
					<p
						className={
							'atlasvoice-editor-status is-' + audio.status
						}
					>
						<b>{ statusWords( audio.status ) }</b>
						{ audio.status === 'making' && <Spinner /> }
					</p>
				) }
				<p>{ audioWords( audio ) }</p>
				{ audio.can_make && (
					<>
						<Button
							variant={
								audio.status === 'ready'
									? 'secondary'
									: 'primary'
							}
							isBusy={ busy === 'audio' }
							disabled={ !! busy }
							onClick={ () =>
								act(
									'audio',
									route + '/audio',
									undefined,
									__(
										'Started. Visitors hear the audio as soon as it is ready.',
										'text-to-audio'
									)
								)
							}
						>
							{ makeLabel }
						</Button>
						<p className="atlasvoice-editor-weak">
							{ __(
								'The text of the post is sent to the AtlasVoice service, and its characters count against the site’s allowance.',
								'text-to-audio'
							) }
						</p>
					</>
				) }
				{ audio.kind === 'browser' && link( '#/voice' ) && (
					<Button variant="link" href={ link( '#/voice' ) }>
						{ __( 'Change the voice', 'text-to-audio' ) }
					</Button>
				) }
				{ audio.kind !== 'browser' && link( '#/library' ) && (
					<Button variant="link" href={ link( '#/library' ) }>
						{ __( 'Open the Audio library', 'text-to-audio' ) }
					</Button>
				) }
			</PanelBody>

			<PanelBody
				title={ __( 'On this post', 'text-to-audio' ) }
				initialOpen
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __(
						'Show the player on this post',
						'text-to-audio'
					) }
					help={
						panel.player.shown
							? __(
									'The player shows here when the site’s rules say so.',
									'text-to-audio'
							  )
							: __(
									'The player is hidden on this post only.',
									'text-to-audio'
							  )
					}
					checked={ panel.player.shown }
					disabled={ !! busy }
					onChange={ ( shown ) =>
						act(
							'player',
							route + '/player',
							{ shown },
							shown
								? __(
										'The player shows on this post again.',
										'text-to-audio'
								  )
								: __(
										'The player is hidden on this post.',
										'text-to-audio'
								  )
						)
					}
				/>
				{ link( '#/content' ) && (
					<Button variant="link" href={ link( '#/content' ) }>
						{ __( 'Check what is read', 'text-to-audio' ) }
					</Button>
				) }
			</PanelBody>

			<PanelBody
				title={ sprintf(
					/* translators: %d: a number of days. */
					__( 'Listening, last %d days', 'text-to-audio' ),
					listening.days
				) }
				initialOpen
			>
				{ listening.counted ? (
					<dl className="atlasvoice-editor-numbers">
						<div>
							<dt>
								{ _n(
									'play',
									'plays',
									listening.plays,
									'text-to-audio'
								) }
							</dt>
							<dd>{ listening.plays.toLocaleString() }</dd>
						</div>
						<div>
							<dt>
								{ _n(
									'listener',
									'listeners',
									listening.listeners,
									'text-to-audio'
								) }
							</dt>
							<dd>{ listening.listeners.toLocaleString() }</dd>
						</div>
					</dl>
				) : (
					<p>
						{ __(
							'Listening is not counted on this site.',
							'text-to-audio'
						) }
					</p>
				) }
				{ link( '#/insights' ) && (
					<Button variant="link" href={ link( '#/insights' ) }>
						{ __( 'Open Insights', 'text-to-audio' ) }
					</Button>
				) }
			</PanelBody>

			<PanelBody
				title={ __( 'Shortcode', 'text-to-audio' ) }
				initialOpen={ false }
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Shortcode', 'text-to-audio' ) }
					help={ __(
						'Put it where the player should be in the text.',
						'text-to-audio'
					) }
					value={ panel.shortcode }
					readOnly
					onChange={ () => {} }
				/>
				<Button variant="secondary" onClick={ copy }>
					{ __( 'Copy', 'text-to-audio' ) }
				</Button>
			</PanelBody>
		</div>
	);
}
