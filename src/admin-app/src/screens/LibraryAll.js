/**
 * Audio library › All posts.
 *
 * Which posts have a stored audio file with the voice in use
 * (GET tta/v1/library, TTA\Library\Posts).
 *
 * Where the site's audio is made by jobs (TTS-354), a post without audio
 * can be made from here, one post at a time: "Make audio" starts its job on
 * the AtlasVoice service (tta/v1/cloud/jobs), the list then shows how far it
 * is, and it can be cancelled. Elsewhere the screen only reads.
 *
 * An extension can add its own actions above the list through the slot
 * "library.actions" (AtlasVoice Pro: the audio of many posts at once).
 *
 * A voice that reads in the browser stores no files, so the screen then says
 * so and points to Voice.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	ExternalLink,
	Notice,
	SearchControl,
	Spinner,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot from '../extend/Slot';
import { Empty, Pane, ProNote, Scroll } from '../shell/parts';
import { AudioAction, AudioStatus, REFRESH_EVERY } from './library-audio';

const ROUTE = 'tta/v1/library';
const JOBS_ROUTE = 'tta/v1/cloud/jobs';

/** How long to wait after the last key before searching, in milliseconds. */
export const SEARCH_DELAY = 300;

/**
 * The name shown for a post.
 *
 * @param {Object} post { id, title }.
 * @return {string} Its title, or its number when it has none.
 */
function postName( post ) {
	return (
		post.title ||
		sprintf(
			/* translators: %d: a post number. */
			__( 'Post %d', 'text-to-audio' ),
			post.id
		)
	);
}

/**
 * A date as the visitor's browser writes it.
 *
 * @param {string} date An ISO 8601 date.
 * @return {string} For example "1 Nov 2026", or nothing when it is not a date.
 */
export function shortDate( date ) {
	const when = new Date( date );

	return Number.isNaN( when.getTime() )
		? ''
		: when.toLocaleDateString( undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
		  } );
}

/**
 * The screen.
 *
 * @return {*} Audio library › All posts.
 */
export default function LibraryAll() {
	const { boot, go, isPro, notify } = useApp();
	const [ status, setStatus ] = useState( 'all' );
	const [ typed, setTyped ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const [ page, setPage ] = useState( 1 );
	const [ library, setLibrary ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ loading, setLoading ] = useState( true );
	// The post whose audio is being started or cancelled right now.
	const [ acting, setActing ] = useState( 0 );
	// Only the answer to the newest question is shown.
	const asked = useRef( 0 );

	const load = useCallback( async () => {
		const mine = ++asked.current;
		setFailure( '' );
		setLoading( true );
		try {
			const answer = await request( boot, ROUTE, {
				query: { status, search, page },
			} );
			if ( mine === asked.current ) {
				setLibrary( answer );
			}
		} catch ( error ) {
			if ( mine === asked.current ) {
				setFailure( error.message );
			}
		}
		if ( mine === asked.current ) {
			setLoading( false );
		}
	}, [ boot, status, search, page ] );

	useEffect( () => {
		load();
	}, [ load ] );

	// Reads the list again without a spinner; a failure keeps what is shown.
	const refresh = useCallback( async () => {
		const mine = ++asked.current;
		try {
			const answer = await request( boot, ROUTE, {
				query: { status, search, page },
			} );
			if ( mine === asked.current ) {
				setLibrary( answer );
			}
		} catch ( error ) {
			// The next round asks again.
		}
	}, [ boot, status, search, page ] );

	// While audio is in the making, the list follows it.
	const making =
		!! library &&
		Array.isArray( library.posts ) &&
		library.posts.some( ( post ) => post.status === 'making' );

	useEffect( () => {
		if ( ! making ) {
			return undefined;
		}
		const timer = setInterval( refresh, REFRESH_EVERY );

		return () => clearInterval( timer );
	}, [ making, refresh ] );

	/**
	 * Starts or cancels the audio job of a post, then reads the list again.
	 *
	 * @param {Object} post   The post.
	 * @param {string} method POST starts, DELETE cancels.
	 */
	const act = async ( post, method ) => {
		setActing( post.id );
		try {
			await request( boot, JOBS_ROUTE, {
				method,
				data: { post_id: post.id },
			} );
			notify(
				method === 'POST'
					? __(
							'The audio is being made. You can leave this screen.',
							'text-to-audio'
					  )
					: __( 'Cancelled.', 'text-to-audio' )
			);
		} catch ( error ) {
			notify( error.message, 'error' );
		}
		await refresh();
		setActing( 0 );
	};

	// Search a moment after the typing stops, not on every key.
	useEffect( () => {
		const wanted = typed.trim();
		if ( wanted === search ) {
			return undefined;
		}
		const timer = setTimeout( () => {
			setPage( 1 );
			setSearch( wanted );
		}, SEARCH_DELAY );

		return () => clearTimeout( timer );
	}, [ typed, search ] );

	const choose = ( value ) => {
		setPage( 1 );
		setStatus( value );
	};

	const clear = () => {
		setTyped( '' );
		setSearch( '' );
		setPage( 1 );
		setStatus( 'all' );
	};

	if ( failure && ! library ) {
		return (
			<Pane canvas>
				<Scroll width={ 1080 }>
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
								'The library could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	if ( ! library ) {
		return (
			<Pane canvas>
				<Scroll width={ 1080 }>
					<div className="atlasvoice-loading" role="status">
						<Spinner />
						{ __( 'Loading…', 'text-to-audio' ) }
					</div>
				</Scroll>
			</Pane>
		);
	}

	if ( ! library.stores_audio ) {
		return (
			<Pane canvas>
				<Scroll width={ 1080 }>
					<Card>
						<Empty
							title={ __(
								'No audio files with the browser voice',
								'text-to-audio'
							) }
							action={
								<Button
									variant="primary"
									onClick={ () => go( 'voice:voice' ) }
									__next40pxDefaultSize
								>
									{ __( 'Choose a voice', 'text-to-audio' ) }
								</Button>
							}
						>
							{ __(
								'The browser voice reads each page on the visitor’s device, so no audio file is stored. A voice that makes MP3 files fills this list.',
								'text-to-audio'
							) }
						</Empty>
					</Card>
				</Scroll>
			</Pane>
		);
	}

	const { counts, posts } = library;
	const filters = [
		[ 'all', __( 'All', 'text-to-audio' ), counts.all ],
		[ 'ready', __( 'Ready', 'text-to-audio' ), counts.ready ],
		[ 'missing', __( 'No audio yet', 'text-to-audio' ), counts.missing ],
	];
	const filtered = status !== 'all' || search !== '';
	// Whether a job can make this site's audio (the natural voice, connected).
	const canMake = !! library.jobs && !! library.jobs.available;

	return (
		<Pane canvas>
			<Scroll width={ 1080 }>
				{ failure && (
					<div className="atlasvoice-section">
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
									'The library could not be loaded: %s',
									'text-to-audio'
								),
								failure
							) }
						</Notice>
					</div>
				) }

				<p className="atlasvoice-weak atlasvoice-section">
					{ sprintf(
						/* translators: %s: the name of a voice, e.g. "AtlasVoice TTS". */
						__(
							'“Ready” means the post’s audio file is stored for the voice in use (%s). “Outdated” means the post was changed after its audio was made. “No audio yet” means no file is stored.',
							'text-to-audio'
						),
						library.voice
					) }
				</p>

				<Slot
					name="library.actions"
					fillProps={ { library, canMake, refresh } }
				/>

				<Card>
					<CardBody>
						<div className="atlasvoice-library-bar">
							<div
								className="atlasvoice-library-filters"
								role="group"
								aria-label={ __(
									'Audio status',
									'text-to-audio'
								) }
							>
								{ filters.map( ( [ value, label, count ] ) => (
									<Button
										key={ value }
										variant={
											status === value
												? 'primary'
												: 'secondary'
										}
										size="compact"
										isPressed={ status === value }
										onClick={ () => choose( value ) }
									>
										{ label + ' ' + count.toLocaleString() }
									</Button>
								) ) }
							</div>
							<div className="atlasvoice-library-search">
								<SearchControl
									__nextHasNoMarginBottom
									label={ __(
										'Find a post',
										'text-to-audio'
									) }
									placeholder={ __(
										'Find a post',
										'text-to-audio'
									) }
									value={ typed }
									onChange={ setTyped }
								/>
							</div>
							{ loading && <Spinner /> }
						</div>
					</CardBody>

					{ posts.length ? (
						<div className="atlasvoice-table-wrap">
							<table className="atlasvoice-table">
								<thead>
									<tr>
										<th scope="col">
											{ __( 'Post', 'text-to-audio' ) }
										</th>
										<th scope="col">
											{ __( 'Audio', 'text-to-audio' ) }
										</th>
										<th scope="col">
											{ __(
												'Last changed',
												'text-to-audio'
											) }
										</th>
										<th scope="col">
											<span className="screen-reader-text">
												{ __(
													'Actions',
													'text-to-audio'
												) }
											</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{ posts.map( ( post ) => (
										<tr key={ post.id }>
											<th
												scope="row"
												className="atlasvoice-library-post"
											>
												<span className="atlasvoice-cell-title">
													{ postName( post ) }
												</span>
												<span className="atlasvoice-library-id">
													{ '#' + post.id }
												</span>
											</th>
											<td>
												<AudioStatus post={ post } />
											</td>
											<td>
												{ shortDate( post.modified ) }
											</td>
											<td className="atlasvoice-td-end">
												<span className="atlasvoice-library-links">
													{ canMake && (
														<AudioAction
															post={ post }
															name={ postName(
																post
															) }
															busy={
																acting ===
																post.id
															}
															onMake={ ( item ) =>
																act(
																	item,
																	'POST'
																)
															}
															onCancel={ (
																item
															) =>
																act(
																	item,
																	'DELETE'
																)
															}
														/>
													) }
													{ post.view_url && (
														<ExternalLink
															href={
																post.view_url
															}
															aria-label={ sprintf(
																/* translators: %s: a post title. */
																__(
																	'View “%s”',
																	'text-to-audio'
																),
																postName( post )
															) }
														>
															{ __(
																'View',
																'text-to-audio'
															) }
														</ExternalLink>
													) }
													{ post.edit_url && (
														<a
															href={
																post.edit_url
															}
															aria-label={ sprintf(
																/* translators: %s: a post title. */
																__(
																	'Edit “%s”',
																	'text-to-audio'
																),
																postName( post )
															) }
														>
															{ __(
																'Edit',
																'text-to-audio'
															) }
														</a>
													) }
												</span>
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					) : (
						<Empty
							title={
								filtered
									? __( 'No posts match', 'text-to-audio' )
									: __(
											'No posts get a player yet',
											'text-to-audio'
									  )
							}
							action={
								filtered ? (
									<Button
										variant="secondary"
										onClick={ clear }
										__next40pxDefaultSize
									>
										{ __(
											'Clear filters',
											'text-to-audio'
										) }
									</Button>
								) : (
									<Button
										variant="primary"
										onClick={ () => go( 'content:where' ) }
										__next40pxDefaultSize
									>
										{ __(
											'Choose where it appears',
											'text-to-audio'
										) }
									</Button>
								)
							}
						>
							{ filtered
								? __(
										'Try another status or other words.',
										'text-to-audio'
								  )
								: __(
										'Published posts of the content types you choose are listed here.',
										'text-to-audio'
								  ) }
						</Empty>
					) }

					{ library.pages > 1 && (
						<CardBody>
							<nav
								className="atlasvoice-library-pager"
								aria-label={ __(
									'Pages of the library',
									'text-to-audio'
								) }
							>
								<span role="status">
									{ sprintf(
										/* translators: 1: page number, 2: number of pages, 3: number of posts. */
										_n(
											'Page %1$s of %2$s, %3$s post',
											'Page %1$s of %2$s, %3$s posts',
											library.total,
											'text-to-audio'
										),
										library.page.toLocaleString(),
										library.pages.toLocaleString(),
										library.total.toLocaleString()
									) }
								</span>
								<Button
									variant="secondary"
									size="compact"
									disabled={ library.page <= 1 }
									onClick={ () =>
										setPage( library.page - 1 )
									}
								>
									{ __( 'Previous', 'text-to-audio' ) }
								</Button>
								<Button
									variant="secondary"
									size="compact"
									disabled={ library.page >= library.pages }
									onClick={ () =>
										setPage( library.page + 1 )
									}
								>
									{ __( 'Next', 'text-to-audio' ) }
								</Button>
							</nav>
						</CardBody>
					) }
				</Card>

				{ ! isPro && (
					<div className="atlasvoice-section">
						<ProNote onSeePro={ () => go( 'account:plans' ) }>
							{ __(
								'Making the audio for many posts at once is part of AtlasVoice Pro.',
								'text-to-audio'
							) }
						</ProNote>
					</div>
				) }
			</Scroll>
		</Pane>
	);
}
