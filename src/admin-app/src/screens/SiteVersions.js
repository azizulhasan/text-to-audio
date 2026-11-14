/**
 * Site health › Versions.
 *
 * The installed version, the older versions with a verdict for this site
 * (safe, works with changes, not possible and why), and the automatic
 * update switches (TTA\Site\Versions, which asks TTA\TTA_Rollback).
 *
 * Going back to an older version replaces the plugin's files. That step
 * stays on the classic Versions screen, which this screen links to; here
 * nothing but the automatic-update switches changes anything.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	RadioControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { classicHashFor } from '../routes';
import { Chip, Pane, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/versions';

/**
 * The verdict of a version, in words and a colour.
 *
 * @param {string} status safe, changes or blocked.
 * @return {Object} { tone, label }.
 */
export function verdict( status ) {
	switch ( status ) {
		case 'safe':
			return { tone: 'ok', label: __( 'Safe', 'text-to-audio' ) };
		case 'changes':
			return {
				tone: 'warn',
				label: __( 'Works, with changes', 'text-to-audio' ),
			};
		default:
			return {
				tone: 'err',
				label: __( 'Not possible', 'text-to-audio' ),
			};
	}
}

/**
 * What a list of versions is for.
 *
 * @param {string} mode both, pro or free.
 * @return {string} The choice, in words.
 */
export function modeLabel( mode ) {
	switch ( mode ) {
		case 'both':
			return __( 'Both plugins together (recommended)', 'text-to-audio' );
		case 'pro':
			return __( 'Only AtlasVoice Pro', 'text-to-audio' );
		default:
			return __( 'Only AtlasVoice', 'text-to-audio' );
	}
}

/**
 * The screen.
 *
 * @return {*} Site health › Versions.
 */
export default function SiteVersions() {
	const { boot, notify } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ mode, setMode ] = useState( '' );
	const [ saving, setSaving ] = useState( false );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setData( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	if ( ! data && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Checking the versions…', 'text-to-audio' ) }
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
								onClick: load,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The versions could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const installed =
		data.installed && typeof data.installed === 'object'
			? data.installed
			: {};
	const modes =
		data.modes && typeof data.modes === 'object' ? data.modes : {};
	const modeIds = Object.keys( modes );
	const shown = modes[ mode ] ? mode : modeIds[ 0 ];
	const rows = Array.isArray( modes[ shown ] ) ? modes[ shown ] : [];
	const errors = Object.values( data.errors || {} );
	const checkout = Object.values( installed ).some(
		( plugin ) => plugin.checkout
	);
	const site = data.site || {};

	const setAutoUpdate = async ( plugin, on ) => {
		setSaving( true );
		try {
			setData(
				await request( boot, ROUTE + '/auto-update', {
					method: 'POST',
					data: { plugin, on },
				} )
			);
			notify(
				on
					? __( 'Automatic updates are on.', 'text-to-audio' )
					: __( 'Automatic updates are off.', 'text-to-audio' )
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
		setSaving( false );
	};

	let rollBack;
	if ( ! data.can_roll_back ) {
		rollBack = __(
			'Going back to an older version is not possible here: your account may not update plugins, or this site does not allow changing plugin files.',
			'text-to-audio'
		);
	} else if ( checkout ) {
		rollBack = __(
			'Going back is not offered on this site: the plugin folder is a Git or SVN checkout, and replacing it would delete the repository.',
			'text-to-audio'
		);
	}

	return (
		<Pane canvas>
			<Scroll width={ 860 }>
				<div className="atlasvoice-section">
					<Notice status="info" isDismissible={ false }>
						<b>
							{ sprintf(
								/* translators: %s: plugin names with their versions, e.g. "AtlasVoice 2.5.0, AtlasVoice Pro 3.6.0". */
								__( 'You are on %s.', 'text-to-audio' ),
								Object.values( installed )
									.map(
										( plugin ) =>
											plugin.label + ' ' + plugin.version
									)
									.join( ', ' )
							) }
						</b>{ ' ' }
						{ __(
							'If something stopped working after an update, you can go back to an earlier version. Settings and audio files are kept.',
							'text-to-audio'
						) }
					</Notice>
				</div>

				{ errors.length > 0 && (
					<div className="atlasvoice-section">
						<Notice
							status="warning"
							isDismissible={ false }
							actions={ [
								{
									label: __( 'Check again', 'text-to-audio' ),
									onClick: load,
								},
							] }
						>
							{ errors.join( ' ' ) }
						</Notice>
					</div>
				) }

				<Section
					title={ __( 'Older versions', 'text-to-audio' ) }
					description={ sprintf(
						/* translators: 1: PHP version, 2: WordPress version. */
						__(
							'Checked against this site: PHP %1$s, WordPress %2$s.',
							'text-to-audio'
						),
						site.php || '?',
						site.wordpress || '?'
					) }
				>
					{ modeIds.length > 1 && (
						<div className="atlasvoice-section">
							<RadioControl
								label={ __(
									'What to go back with',
									'text-to-audio'
								) }
								selected={ shown }
								options={ modeIds.map( ( id ) => ( {
									label: modeLabel( id ),
									value: id,
								} ) ) }
								onChange={ setMode }
							/>
						</div>
					) }
					<Card>
						{ rows.length ? (
							<ul className="atlasvoice-rows">
								{ rows.map( ( row ) => {
									const { tone, label } = verdict(
										row.status
									);
									const why = [
										...( row.blocks || [] ),
										...( row.changes || [] ),
									];

									return (
										<li
											key={ row.version }
											className="atlasvoice-row"
										>
											<span className="atlasvoice-row-text">
												<b>{ row.label }</b>
												<span className="atlasvoice-weak">
													{ why.join( ' ' ) ||
														( row.recommended
															? __(
																	'The newest version that is safe for this site.',
																	'text-to-audio'
															  )
															: __(
																	'Nothing to know.',
																	'text-to-audio'
															  ) ) }
												</span>
											</span>
											<Chip tone={ tone } dot>
												{ label }
											</Chip>
										</li>
									);
								} ) }
							</ul>
						) : (
							<CardBody>
								<p className="atlasvoice-weak">
									{ __(
										'There is no older version to go back to.',
										'text-to-audio'
									) }
								</p>
							</CardBody>
						) }
					</Card>
					<div className="atlasvoice-actions atlasvoice-actions-below">
						{ rollBack ? (
							<span className="atlasvoice-weak">
								{ rollBack }
							</span>
						) : (
							<>
								<Button
									variant="secondary"
									href={
										boot.classicUrl +
										classicHashFor( 'site:versions' )
									}
									__next40pxDefaultSize
								>
									{ __(
										'Go back to an older version…',
										'text-to-audio'
									) }
								</Button>
								<span className="atlasvoice-weak">
									{ __(
										'Opens the classic Versions screen, where you choose the version and confirm.',
										'text-to-audio'
									) }
								</span>
							</>
						) }
					</div>
				</Section>

				<Section
					title={ __( 'Automatic updates', 'text-to-audio' ) }
					description={ __(
						'The same switch as “Enable auto-updates” on the Plugins screen.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								{ Object.keys( installed ).map( ( id ) => (
									<ToggleControl
										key={ id }
										__nextHasNoMarginBottom
										label={ sprintf(
											/* translators: %s: plugin name, e.g. AtlasVoice. */
											__(
												'%s updates itself',
												'text-to-audio'
											),
											installed[ id ].label
										) }
										help={ __(
											'WordPress installs new versions without asking.',
											'text-to-audio'
										) }
										checked={
											!! installed[ id ].auto_update
										}
										disabled={ saving }
										onChange={ ( on ) =>
											setAutoUpdate( id, on )
										}
									/>
								) ) }
							</div>
						</CardBody>
					</Card>
				</Section>
			</Scroll>
		</Pane>
	);
}
