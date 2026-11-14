/**
 * Insights › Overview, Posts and Listeners.
 *
 * Three views of one report: how much the audio is listened to in a period
 * (GET tta/v1/report, TTA\Insights\Report). The report holds sums only, no
 * single listener, and the screens only read.
 *
 * Device, browser, system and country numbers show when the site's report
 * has them (a plugin adds them; today that is AtlasVoice Pro). Without
 * them the Listeners view says so in one line.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	SearchControl,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { Empty, Pane, ProNote, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/report';

/** The period last chosen, kept while moving between the three views. */
let lastRange = '30';

/**
 * A number of seconds as hours and minutes.
 *
 * @param {number} seconds Listening time in seconds.
 * @return {string} For example "2 h 5 min", "5 min" or "40 s".
 */
export function listeningTime( seconds ) {
	const total = Math.max( 0, Math.round( Number( seconds ) || 0 ) );
	if ( total < 60 ) {
		return sprintf(
			/* translators: %d: a number of seconds. */
			__( '%d s', 'text-to-audio' ),
			total
		);
	}

	const minutes = Math.floor( total / 60 );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d: a number of minutes. */
			__( '%d min', 'text-to-audio' ),
			minutes
		);
	}

	return sprintf(
		/* translators: 1: a number of hours, 2: a number of minutes. */
		__( '%1$d h %2$d min', 'text-to-audio' ),
		Math.floor( minutes / 60 ),
		minutes % 60
	);
}

/**
 * A part of a whole as a whole percentage, 0 when there is no whole.
 *
 * @param {number} part  The part.
 * @param {number} whole The whole.
 * @return {number} 0 to 100.
 */
export function percentOf( part, whole ) {
	const all = Number( whole ) || 0;
	if ( all <= 0 ) {
		return 0;
	}

	return Math.min(
		100,
		Math.max( 0, Math.round( ( ( Number( part ) || 0 ) / all ) * 100 ) )
	);
}

/**
 * The busiest hour of the day, in words.
 *
 * @param {number[]} hours 24 counts.
 * @return {string} For example "Busiest hour: 14:00 to 15:00 (UTC).", or that there is none.
 */
export function busiestHour( hours ) {
	const list = Array.isArray( hours ) ? hours : [];
	const most = Math.max( 0, ...list );
	if ( most <= 0 ) {
		return __( 'No plays in this period.', 'text-to-audio' );
	}

	const hour = list.indexOf( most );
	const pad = ( value ) => String( value ).padStart( 2, '0' );

	return sprintf(
		/* translators: 1: start hour, 2: end hour, e.g. 14:00 and 15:00. */
		__( 'Busiest hour: %1$s to %2$s (UTC).', 'text-to-audio' ),
		pad( hour ) + ':00',
		pad( ( hour + 1 ) % 24 ) + ':00'
	);
}

/**
 * One number with its name.
 *
 * @param {Object} props
 * @param {string} props.label What the number is.
 * @param {string} props.value The number, as text.
 * @param {string} props.note  A line under it.
 * @return {*} The tile.
 */
function Stat( { label, value, note } ) {
	return (
		<div className="atlasvoice-stat">
			<span className="atlasvoice-stat-label">{ label }</span>
			<b className="atlasvoice-stat-value">{ value }</b>
			{ note && <span className="atlasvoice-weak">{ note }</span> }
		</div>
	);
}

/**
 * Rows of a name, a bar and a number.
 *
 * @param {Object} props
 * @param {Array}  props.rows [ { name, value, text } ]: value is 0 to 100.
 * @return {*} The list.
 */
function Bars( { rows } ) {
	return (
		<ul className="atlasvoice-bars">
			{ rows.map( ( row ) => (
				<li key={ row.name } className="atlasvoice-bars-row">
					<span className="atlasvoice-bars-name">{ row.name }</span>
					<progress
						className="atlasvoice-meter"
						max="100"
						value={ row.value }
						aria-label={ row.name }
					/>
					<span className="atlasvoice-bars-value">{ row.text }</span>
				</li>
			) ) }
		</ul>
	);
}

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
 * A table of posts.
 *
 * @param {Object}  props
 * @param {Array}   props.posts [ { id, title, plays, seconds, finished } ].
 * @param {boolean} props.full  Whether to show every column.
 * @return {*} The table.
 */
function PostsTable( { posts, full } ) {
	return (
		<div className="atlasvoice-table-wrap">
			<table className="atlasvoice-table">
				<thead>
					<tr>
						<th scope="col">{ __( 'Post', 'text-to-audio' ) }</th>
						<th scope="col">{ __( 'Plays', 'text-to-audio' ) }</th>
						<th scope="col">
							{ __( 'Finished', 'text-to-audio' ) }
						</th>
						{ full && (
							<>
								<th scope="col">
									{ __( 'Listening time', 'text-to-audio' ) }
								</th>
								<th scope="col">
									{ __( 'Average listen', 'text-to-audio' ) }
								</th>
							</>
						) }
					</tr>
				</thead>
				<tbody>
					{ posts.map( ( post ) => (
						<tr key={ post.id }>
							<th scope="row">{ postName( post ) }</th>
							<td>{ post.plays.toLocaleString() }</td>
							<td>
								{ sprintf(
									/* translators: %d: a percentage. */
									__( '%d%%', 'text-to-audio' ),
									percentOf( post.finished, post.plays )
								) }
							</td>
							{ full && (
								<>
									<td>{ listeningTime( post.seconds ) }</td>
									<td>
										{ post.plays
											? listeningTime(
													post.seconds / post.plays
											  )
											: '—' }
									</td>
								</>
							) }
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
}

/**
 * Insights › Overview.
 *
 * @param {Object}   props
 * @param {Object}   props.report The report.
 * @param {Function} props.go     Opens another screen.
 * @return {*} The view.
 */
function Overview( { report, go } ) {
	const { totals, progress } = report;
	const started = progress.started;
	const hours = Array.isArray( report.hours ) ? report.hours : [];
	const mostInAnHour = Math.max( 1, ...hours );

	return (
		<>
			<div className="atlasvoice-stats atlasvoice-section">
				<Stat
					label={ __( 'Plays', 'text-to-audio' ) }
					value={ totals.plays.toLocaleString() }
				/>
				<Stat
					label={ __( 'Listening time', 'text-to-audio' ) }
					value={ listeningTime( totals.seconds ) }
				/>
				<Stat
					label={ __( 'Finished listening', 'text-to-audio' ) }
					value={ sprintf(
						/* translators: %d: a percentage. */
						__( '%d%%', 'text-to-audio' ),
						percentOf( totals.finished, totals.plays )
					) }
					note={ sprintf(
						/* translators: %s: a number of plays. */
						_n(
							'%s play to the end',
							'%s plays to the end',
							totals.finished,
							'text-to-audio'
						),
						totals.finished.toLocaleString()
					) }
				/>
				<Stat
					label={ __( 'Listeners', 'text-to-audio' ) }
					value={ totals.listeners.toLocaleString() }
				/>
			</div>

			<div className="atlasvoice-grid is-2 atlasvoice-section">
				<Card>
					<CardBody>
						<h2 className="atlasvoice-card-title">
							{ __( 'How far people listen', 'text-to-audio' ) }
						</h2>
						<Bars
							rows={ [
								[ __( 'Started', 'text-to-audio' ), started ],
								[
									__( 'Reached 25%', 'text-to-audio' ),
									progress.quarter,
								],
								[
									__( 'Reached 50%', 'text-to-audio' ),
									progress.half,
								],
								[
									__( 'Reached 75%', 'text-to-audio' ),
									progress.three_quarters,
								],
								[
									__( 'Finished', 'text-to-audio' ),
									progress.finished,
								],
							].map( ( [ name, count ] ) => ( {
								name,
								value: percentOf( count, started ),
								text: sprintf(
									/* translators: %d: a percentage. */
									__( '%d%%', 'text-to-audio' ),
									percentOf( count, started )
								),
							} ) ) }
						/>
					</CardBody>
				</Card>
				<Card>
					<CardBody>
						<h2 className="atlasvoice-card-title">
							{ __(
								'Plays by hour of the day',
								'text-to-audio'
							) }
						</h2>
						<div
							className="atlasvoice-hours"
							role="img"
							aria-label={ busiestHour( hours ) }
						>
							{ hours.map( ( count, hour ) => (
								<i
									// eslint-disable-next-line react/no-array-index-key -- the index is the hour of the day.
									key={ hour }
									style={ {
										height:
											Math.max(
												4,
												Math.round(
													( count / mostInAnHour ) *
														100
												)
											) + '%',
									} }
								/>
							) ) }
						</div>
						<p className="atlasvoice-weak">
							{ busiestHour( hours ) }
						</p>
					</CardBody>
				</Card>
			</div>

			<Section
				title={ __( 'Most played posts', 'text-to-audio' ) }
				end={
					<Button
						variant="link"
						onClick={ () => go( 'insights:posts' ) }
					>
						{ __( 'All posts', 'text-to-audio' ) }
					</Button>
				}
			>
				<Card>
					<PostsTable posts={ report.posts.slice( 0, 5 ) } />
				</Card>
			</Section>
		</>
	);
}

/**
 * Insights › Posts.
 *
 * @param {Object} props
 * @param {Object} props.report The report.
 * @return {*} The view.
 */
function Posts( { report } ) {
	const [ query, setQuery ] = useState( '' );
	const wanted = query.trim().toLowerCase();
	const posts = report.posts.filter(
		( post ) =>
			! wanted ||
			( post.title + ' ' + post.id ).toLowerCase().includes( wanted )
	);

	return (
		<Card>
			<CardBody>
				<SearchControl
					__nextHasNoMarginBottom
					label={ __( 'Find a post', 'text-to-audio' ) }
					placeholder={ __(
						'Find a post by title or number',
						'text-to-audio'
					) }
					value={ query }
					onChange={ setQuery }
				/>
			</CardBody>
			{ posts.length ? (
				<PostsTable posts={ posts } full />
			) : (
				<CardBody>
					<p className="atlasvoice-weak" role="status">
						{ __(
							'No played post matches this.',
							'text-to-audio'
						) }
					</p>
				</CardBody>
			) }
		</Card>
	);
}

/**
 * Insights › Listeners.
 *
 * @param {Object}   props
 * @param {Object}   props.report The report.
 * @param {boolean}  props.isPro  Whether Pro is active.
 * @param {Function} props.go     Opens another screen.
 * @return {*} The view.
 */
function Listeners( { report, isPro, go } ) {
	const { totals } = report;
	const breakdowns = report.breakdowns || {};
	const titles = {
		devices: __( 'Devices', 'text-to-audio' ),
		browsers: __( 'Browsers', 'text-to-audio' ),
		systems: __( 'Systems', 'text-to-audio' ),
		countries: __( 'Countries', 'text-to-audio' ),
	};
	const shown = Object.keys( titles ).filter(
		( name ) =>
			Array.isArray( breakdowns[ name ] ) && breakdowns[ name ].length
	);

	return (
		<>
			<div className="atlasvoice-stats atlasvoice-section">
				<Stat
					label={ __( 'Listeners', 'text-to-audio' ) }
					value={ totals.listeners.toLocaleString() }
				/>
				<Stat
					label={ __( 'New listeners', 'text-to-audio' ) }
					value={ totals.new_listeners.toLocaleString() }
				/>
				<Stat
					label={ __( 'Returning listeners', 'text-to-audio' ) }
					value={ totals.returning_listeners.toLocaleString() }
				/>
			</div>

			{ shown.length > 0 && (
				<div className="atlasvoice-grid is-2 atlasvoice-section">
					{ shown.map( ( name ) => {
						const rows = breakdowns[ name ];
						const all = rows.reduce(
							( sum, row ) => sum + row.count,
							0
						);

						return (
							<Card key={ name }>
								<CardBody>
									<h2 className="atlasvoice-card-title">
										{ titles[ name ] }
									</h2>
									<Bars
										rows={ rows.map( ( row ) => ( {
											name: row.name,
											value: percentOf( row.count, all ),
											text: sprintf(
												/* translators: %d: a percentage. */
												__( '%d%%', 'text-to-audio' ),
												percentOf( row.count, all )
											),
										} ) ) }
									/>
								</CardBody>
							</Card>
						);
					} ) }
				</div>
			) }

			{ shown.length === 0 &&
				( isPro ? (
					<p className="atlasvoice-weak">
						{ __(
							'There are no device, browser or country numbers for this period yet.',
							'text-to-audio'
						) }
					</p>
				) : (
					<ProNote onSeePro={ () => go( 'account:plans' ) }>
						{ __(
							'Which devices, browsers, systems and countries your listeners use is part of AtlasVoice Pro.',
							'text-to-audio'
						) }
					</ProNote>
				) ) }

			<p className="atlasvoice-weak">
				{ __(
					'A listener is a browser, told apart by an identifier that is not a name, an email or an IP address.',
					'text-to-audio'
				) }
			</p>
		</>
	);
}

/**
 * The screen: the view of the tab that is open.
 *
 * @return {*} Insights › Overview, Posts or Listeners.
 */
export default function InsightsReport() {
	const { boot, go, isPro, route } = useApp();
	const [ range, setRange ] = useState( lastRange );
	const [ report, setReport ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ loading, setLoading ] = useState( true );

	const load = useCallback( async () => {
		setFailure( '' );
		setLoading( true );
		try {
			setReport( await request( boot, ROUTE + '?range=' + range ) );
		} catch ( error ) {
			setFailure( error.message );
		}
		setLoading( false );
	}, [ boot, range ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const choose = ( value ) => {
		lastRange = value;
		setRange( value );
	};

	const picker = (
		<div className="atlasvoice-rangepicker">
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Period', 'text-to-audio' ) }
				value={ range }
				onChange={ choose }
				options={ [
					{ label: __( 'Last 7 days', 'text-to-audio' ), value: '7' },
					{
						label: __( 'Last 30 days', 'text-to-audio' ),
						value: '30',
					},
					{
						label: __( 'Last 90 days', 'text-to-audio' ),
						value: '90',
					},
					{ label: __( 'All time', 'text-to-audio' ), value: 'all' },
				] }
			/>
			{ loading && report && <Spinner /> }
		</div>
	);

	let body;
	if ( failure ) {
		body = (
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
						'The numbers could not be loaded: %s',
						'text-to-audio'
					),
					failure
				) }
			</Notice>
		);
	} else if ( ! report ) {
		body = (
			<div className="atlasvoice-loading" role="status">
				<Spinner />
				{ __( 'Loading…', 'text-to-audio' ) }
			</div>
		);
	} else if (
		! report.totals ||
		report.totals.plays + report.posts.length === 0
	) {
		body = (
			<Card>
				<Empty
					title={ __( 'No plays in this period', 'text-to-audio' ) }
					action={
						! report.counting && (
							<Button
								variant="primary"
								onClick={ () => go( 'insights:tracking' ) }
								__next40pxDefaultSize
							>
								{ __( 'Open Tracking', 'text-to-audio' ) }
							</Button>
						)
					}
				>
					{ report.counting
						? __(
								'Numbers appear here after visitors press play. Plays are counted on your own site, without cookies.',
								'text-to-audio'
						  )
						: __(
								'Plays are not counted on this site. Turn counting on in Tracking to see numbers here.',
								'text-to-audio'
						  ) }
				</Empty>
			</Card>
		);
	} else {
		const view = route && route.tab;
		body = (
			<>
				{ ! report.counting && (
					<div className="atlasvoice-section">
						<Notice
							status="warning"
							isDismissible={ false }
							actions={ [
								{
									label: __(
										'Open Tracking',
										'text-to-audio'
									),
									onClick: () => go( 'insights:tracking' ),
									variant: 'link',
								},
							] }
						>
							{ __(
								'Counting is off, so these numbers stopped growing.',
								'text-to-audio'
							) }
						</Notice>
					</div>
				) }
				{ view === 'posts' && <Posts report={ report } /> }
				{ view === 'listeners' && (
					<Listeners report={ report } isPro={ isPro } go={ go } />
				) }
				{ view !== 'posts' && view !== 'listeners' && (
					<Overview report={ report } go={ go } />
				) }
			</>
		);
	}

	return (
		<Pane canvas>
			<Scroll width={ 1080 }>
				<div className="atlasvoice-section">{ picker }</div>
				{ body }
			</Scroll>
		</Pane>
	);
}
