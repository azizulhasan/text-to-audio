/**
 * Help › More plugins.
 *
 * The other free AtlasAiDev plugins and whether each is on this site
 * (GET tta/v1/more-plugins, TTA\Help\More_Plugins). The screen only reads
 * and nothing is fetched from another site. Installing is left to
 * WordPress's own Plugins screen, which the Install link opens.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	ExternalLink,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { Chip, Empty, Pane, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/more-plugins';

/**
 * The screen.
 *
 * @return {*} Help › More plugins.
 */
export default function HelpMore() {
	const { boot } = useApp();
	const [ list, setList ] = useState( null );
	const [ failure, setFailure ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setList( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

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
					__( 'The list could not be loaded: %s', 'text-to-audio' ),
					failure
				) }
			</Notice>
		);
	} else if ( ! list ) {
		body = (
			<div className="atlasvoice-loading" role="status">
				<Spinner />
				{ __( 'Loading…', 'text-to-audio' ) }
			</div>
		);
	} else if ( ! list.plugins.length ) {
		body = (
			<Card>
				<Empty title={ __( 'Nothing to show', 'text-to-audio' ) }>
					{ __(
						'There is no other plugin on the list right now.',
						'text-to-audio'
					) }
				</Empty>
			</Card>
		);
	} else {
		body = (
			<Section
				title={ __( 'Other AtlasAiDev plugins', 'text-to-audio' ) }
				description={ __(
					'Free on WordPress.org. This list is part of the plugin: nothing is fetched to show it.',
					'text-to-audio'
				) }
				end={
					list.list_url && (
						<Button variant="link" href={ list.list_url }>
							{ __( 'See the full page', 'text-to-audio' ) }
						</Button>
					)
				}
			>
				<Card>
					<ul className="atlasvoice-rows">
						{ list.plugins.map( ( plugin ) => (
							<li key={ plugin.slug } className="atlasvoice-row">
								<span className="atlasvoice-row-text">
									<b>{ plugin.name }</b>
									<span className="atlasvoice-weak">
										{ plugin.description }
									</span>
									<ExternalLink
										href={ plugin.url }
										aria-label={ sprintf(
											/* translators: %s: plugin name. */
											__(
												'%s on WordPress.org',
												'text-to-audio'
											),
											plugin.name
										) }
									>
										{ __(
											'On WordPress.org',
											'text-to-audio'
										) }
									</ExternalLink>
								</span>
								<span className="atlasvoice-more-state">
									{ plugin.active && (
										<Chip tone="ok" dot>
											{ __( 'Active', 'text-to-audio' ) }
										</Chip>
									) }
									{ ! plugin.active && plugin.installed && (
										<Chip tone="info" dot>
											{ __(
												'Installed',
												'text-to-audio'
											) }
										</Chip>
									) }
									{ ! plugin.installed &&
										plugin.install_url && (
											<Button
												variant="secondary"
												href={ plugin.install_url }
												aria-label={ sprintf(
													/* translators: %s: plugin name. */
													__(
														'Install %s',
														'text-to-audio'
													),
													plugin.name
												) }
												__next40pxDefaultSize
											>
												{ __(
													'Install',
													'text-to-audio'
												) }
											</Button>
										) }
								</span>
							</li>
						) ) }
					</ul>
				</Card>
				{ ! list.can_install && (
					<p className="atlasvoice-weak">
						{ __(
							'Your account may not install plugins on this site. An administrator can.',
							'text-to-audio'
						) }
					</p>
				) }
			</Section>
		);
	}

	return (
		<Pane canvas>
			<Scroll width={ 860 }>{ body }</Scroll>
		</Pane>
	);
}
