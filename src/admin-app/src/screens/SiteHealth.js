/**
 * Site health › Health.
 *
 * What could keep visitors from hearing the audio, checked on this site:
 * first the things that need the owner, then everything that is checked,
 * then the caching plugins AtlasVoice adjusts to (TTA\Site\Health).
 *
 * The checks only read. "Check again" asks for them again; the one button
 * that changes something forgets a blocked-script report after the CDN was
 * fixed.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Card, CardBody, Notice, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { Chip, Pane, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/health';

/**
 * The status of a check, in a word and a colour.
 *
 * @param {string} status ok, info, warn or error.
 * @return {Object} { tone, label }.
 */
export function statusWords( status ) {
	switch ( status ) {
		case 'ok':
			return { tone: 'ok', label: __( 'Fine', 'text-to-audio' ) };
		case 'info':
			return {
				tone: 'info',
				label: __( 'Good to know', 'text-to-audio' ),
			};
		case 'error':
			return { tone: 'err', label: __( 'Problem', 'text-to-audio' ) };
		default:
			// A status this screen does not know is never shown as fine.
			return { tone: 'warn', label: __( 'Check this', 'text-to-audio' ) };
	}
}

/**
 * One check.
 *
 * @param {Object}   props
 * @param {Object}   props.check   { id, title, status, detail, route }.
 * @param {Function} props.onOpen  Opens the screen that fixes it.
 * @param {Function} props.onCdn   Forgets the CDN report.
 * @param {boolean}  props.busy    Whether a request is running.
 * @param {boolean}  props.withFix Whether to offer the way to fix it.
 * @return {*} The row.
 */
function CheckRow( { check, onOpen, onCdn, busy, withFix } ) {
	const { tone, label } = statusWords( check.status );

	return (
		<li className="atlasvoice-row">
			<span className="atlasvoice-row-text">
				<b>{ check.title }</b>
				<span className="atlasvoice-weak">{ check.detail }</span>
			</span>
			{ withFix && check.route && (
				<Button
					variant="secondary"
					size="compact"
					onClick={ () => onOpen( check.route ) }
				>
					{ __( 'Open', 'text-to-audio' ) }
				</Button>
			) }
			{ withFix && check.id === 'cdn' && (
				<Button
					variant="secondary"
					size="compact"
					disabled={ busy }
					onClick={ onCdn }
				>
					{ __( 'I fixed it, check again', 'text-to-audio' ) }
				</Button>
			) }
			<Chip tone={ tone } dot>
				{ label }
			</Chip>
		</li>
	);
}

/**
 * The screen.
 *
 * @return {*} Site health › Health.
 */
export default function SiteHealth() {
	const { boot, go, notify } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ busy, setBusy ] = useState( false );

	const load = useCallback(
		async ( announce ) => {
			setFailure( '' );
			setBusy( true );
			try {
				const health = await request( boot, ROUTE );
				setData( health );
				if ( announce ) {
					const count = Number( health.needs_attention ) || 0;
					notify(
						count
							? sprintf(
									/* translators: %d: a number of checks. */
									_n(
										'Checked: %d thing needs you.',
										'Checked: %d things need you.',
										count,
										'text-to-audio'
									),
									count
							  )
							: __(
									'Checked: nothing needs you.',
									'text-to-audio'
							  )
					);
				}
			} catch ( error ) {
				setFailure( error.message );
			}
			setBusy( false );
		},
		[ boot, notify ]
	);

	useEffect( () => {
		load( false );
	}, [ load ] );

	if ( ! data && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Checking…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! data ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: () => load( false ),
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The checks could not be run: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const checks = Array.isArray( data.checks ) ? data.checks : [];
	const plugins = Array.isArray( data.plugins ) ? data.plugins : [];
	const needs = checks.filter(
		( check ) => check.status !== 'ok' && check.status !== 'info'
	);

	const cdnFixed = async () => {
		setBusy( true );
		try {
			setData(
				await request( boot, ROUTE + '/cdn-fixed', { method: 'POST' } )
			);
			notify(
				__(
					'Noted. If a visitor still meets the problem, it shows here again.',
					'text-to-audio'
				)
			);
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'Not changed: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setBusy( false );
	};

	return (
		<Pane canvas>
			<Scroll width={ 900 }>
				<Section
					title={
						needs.length
							? __( 'Things that need you', 'text-to-audio' )
							: __( 'Nothing needs you', 'text-to-audio' )
					}
					description={ __(
						'Checked just now, when this screen opened. Checking changes nothing on your site.',
						'text-to-audio'
					) }
					end={
						<Button
							variant="primary"
							isBusy={ busy }
							disabled={ busy }
							onClick={ () => load( true ) }
							__next40pxDefaultSize
						>
							{ __( 'Check again', 'text-to-audio' ) }
						</Button>
					}
				>
					<Card>
						{ needs.length ? (
							<ul className="atlasvoice-rows">
								{ needs.map( ( check ) => (
									<CheckRow
										key={ check.id }
										check={ check }
										onOpen={ go }
										onCdn={ cdnFixed }
										busy={ busy }
										withFix
									/>
								) ) }
							</ul>
						) : (
							<CardBody>
								<p className="atlasvoice-weak">
									{ __(
										'The site is live, a voice is chosen, the player is added to your posts, and nothing was reported as blocked.',
										'text-to-audio'
									) }
								</p>
							</CardBody>
						) }
					</Card>
				</Section>

				<Section title={ __( 'Everything we check', 'text-to-audio' ) }>
					<Card>
						<ul className="atlasvoice-rows">
							{ checks.map( ( check ) => (
								<CheckRow key={ check.id } check={ check } />
							) ) }
						</ul>
					</Card>
				</Section>

				<Section
					title={ __( 'Plugins we work with', 'text-to-audio' ) }
					description={ __(
						'Caching and speed plugins can delay or merge scripts. AtlasVoice keeps its own scripts out of that, automatically.',
						'text-to-audio'
					) }
				>
					<Card>
						<div className="atlasvoice-table-wrap">
							<table className="atlasvoice-table">
								<thead>
									<tr>
										<th scope="col">
											{ __( 'Plugin', 'text-to-audio' ) }
										</th>
										<th scope="col">
											{ __(
												'What we do',
												'text-to-audio'
											) }
										</th>
										<th scope="col">
											{ __( 'Status', 'text-to-audio' ) }
										</th>
									</tr>
								</thead>
								<tbody>
									{ plugins.map( ( plugin ) => (
										<tr key={ plugin.name }>
											<th scope="row">{ plugin.name }</th>
											<td>{ plugin.detail }</td>
											<td>
												<Chip
													tone={
														plugin.active
															? 'ok'
															: undefined
													}
													dot
												>
													{ plugin.active
														? __(
																'Works',
																'text-to-audio'
														  )
														: __(
																'Not active',
																'text-to-audio'
														  ) }
												</Chip>
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					</Card>
				</Section>
			</Scroll>
		</Pane>
	);
}
