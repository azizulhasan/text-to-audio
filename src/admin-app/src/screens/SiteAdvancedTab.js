/**
 * Site health › Advanced.
 *
 * The advanced switches (what shows in the WordPress toolbar and dashboard,
 * how the browser voice behaves when the listener changes tabs, deleting
 * data with the plugin), a button that clears AtlasVoice's cache, and under
 * them the way back to the classic screens (SiteAdvanced).
 *
 * A form with a Save footer: nothing is written until Save. It stores
 * nothing new; the site saves each switch in the field the classic Settings
 * screen uses (TTA\Site\Advanced). Clearing the cache acts at once.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import SiteAdvanced from './SiteAdvanced';

const ROUTE = 'tta/v1/advanced';

/**
 * The screen.
 *
 * @return {*} Site health › Advanced.
 */
export default function SiteAdvancedTab() {
	const { boot, notify } = useApp();
	const [ clearing, setClearing ] = useState( false );
	const form = useSettingsForm(
		ROUTE,
		__( 'Advanced settings saved.', 'text-to-audio' )
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<Scroll width={ 760 }>
					<div className="atlasvoice-section">
						<Notice
							status="error"
							isDismissible={ false }
							actions={ [
								{
									label: __( 'Try again', 'text-to-audio' ),
									onClick: form.reload,
								},
							] }
						>
							{ sprintf(
								/* translators: %s: error message from the site. */
								__(
									'The advanced settings could not be loaded: %s',
									'text-to-audio'
								),
								form.failure
							) }
						</Notice>
					</div>
					{ /* The way back to the classic screens must work even then. */ }
					<SiteAdvanced bare />
				</Scroll>
			</Pane>
		);
	}

	if ( form.loading ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	/**
	 * One switch.
	 *
	 * @param {string} name  Part of the settings.
	 * @param {string} label What it does.
	 * @param {string} help  A line under it.
	 * @return {*} The switch.
	 */
	const toggle = ( name, label, help ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			checked={ !! values[ name ] }
			onChange={ ( value ) => set( name, value ) }
		/>
	);

	const clearCache = async () => {
		setClearing( true );
		try {
			await request( boot, ROUTE + '/clear-cache', { method: 'POST' } );
			notify(
				__(
					'Cache cleared. Nothing you saved was removed.',
					'text-to-audio'
				)
			);
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'The cache was not cleared: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setClearing( false );
	};

	return (
		<Pane
			canvas
			footer={
				<SaveBar
					dirty={ form.dirty }
					saving={ form.saving }
					onSave={ form.save }
				/>
			}
		>
			<Scroll width={ 760 }>
				<Section
					title={ __(
						'In the WordPress toolbar and dashboard',
						'text-to-audio'
					) }
					description={ __(
						'Only people who manage the site see these.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								{ toggle(
									'mode_bar',
									__(
										'Staging or Live in the toolbar',
										'text-to-audio'
									),
									__(
										'Shows at a glance whether visitors can hear the audio.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'post_toggle',
									__(
										'Player on or off for one post, in the toolbar',
										'text-to-audio'
									),
									__(
										'While viewing a post, turn its player off or on from the toolbar.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'picker',
									__(
										'On-page content picker',
										'text-to-audio'
									),
									__(
										'Shows the picker tabs on the front end, to choose what is read aloud right on the page.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'dashboard_widget',
									__(
										'Quick stats on the WordPress dashboard',
										'text-to-audio'
									)
								) }
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __(
						'When the listener changes tabs',
						'text-to-audio'
					) }
					description={ __(
						'For the browser voice. A player that plays an audio file keeps playing like any audio.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								{ toggle(
									'keep_reading',
									__(
										'Keep reading in another tab',
										'text-to-audio'
									),
									__(
										'Off: reading pauses when the listener leaves the tab.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'no_auto_play',
									__(
										'Do not start again by itself',
										'text-to-audio'
									),
									__(
										'When the listener comes back to the tab, reading waits for a click.',
										'text-to-audio'
									)
								) }
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Cache', 'text-to-audio' ) }
					description={ __(
						'AtlasVoice remembers its settings and some lists for speed. Clear it when a change does not show. No setting, statistic or audio file is removed.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<Button
								variant="secondary"
								isBusy={ clearing }
								disabled={ clearing }
								onClick={ clearCache }
								__next40pxDefaultSize
							>
								{ __(
									'Clear the AtlasVoice cache',
									'text-to-audio'
								) }
							</Button>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __(
						'When the plugin is deleted',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								{ toggle(
									'delete_on_uninstall',
									__(
										'Delete all AtlasVoice data with the plugin',
										'text-to-audio'
									),
									__(
										'Off: your settings, statistics and audio files stay, so you can install again later.',
										'text-to-audio'
									)
								) }
								{ values.delete_on_uninstall && (
									<Notice
										status="warning"
										isDismissible={ false }
									>
										{ __(
											'Deleting the plugin will then remove every setting, statistic and audio file of AtlasVoice. It cannot be undone. Deactivating the plugin removes nothing.',
											'text-to-audio'
										) }
									</Notice>
								) }
							</div>
						</CardBody>
					</Card>
				</Section>

				<SiteAdvanced bare />
			</Scroll>
		</Pane>
	);
}
