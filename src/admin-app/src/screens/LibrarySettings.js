/**
 * Audio library › Settings: when the audio of a post is made (TTS-354).
 *
 * Two choices, saved through tta/v1/library/settings (TTA\Library\Audio):
 *  - on the first play, as every site does until it chooses otherwise;
 *  - when a post is published or changed: a job on the AtlasVoice service
 *    makes the whole file in the background.
 *
 * The second choice sends post text to the service without a click per
 * post, so the screen says so in plain words before it is saved.
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, CardBody, Notice, Spinner } from '@wordpress/components';

import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import Tiles from '../shell/Tiles';

const ROUTE = 'tta/v1/library/settings';

/**
 * The screen.
 *
 * @return {*} Audio library › Settings.
 */
export default function LibrarySettings() {
	const { go } = useApp();
	const form = useSettingsForm(
		ROUTE,
		__( 'Audio settings saved.', 'text-to-audio' )
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
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
								'The audio settings could not be loaded: %s',
								'text-to-audio'
							),
							form.failure
						) }
					</Notice>
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

	const onPublish = values.when === 'publish';

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
				{ ! values.available && (
					<div className="atlasvoice-section">
						<Notice
							status={ onPublish ? 'warning' : 'info' }
							isDismissible={ false }
							actions={ [
								{
									label: __( 'Open Voice', 'text-to-audio' ),
									onClick: () => go( 'voice:voice' ),
									variant: 'link',
								},
							] }
						>
							{ values.reason === 'not_connected'
								? __(
										'Audio in the background needs this site to be connected to the AtlasVoice service. Until then, audio is made on the first play.',
										'text-to-audio'
								  )
								: __(
										'Audio in the background works with the voices of the AtlasVoice service. With the voice in use now, audio is made as that voice makes it.',
										'text-to-audio'
								  ) }
						</Notice>
					</div>
				) }

				<Section
					title={ __( 'When audio is made', 'text-to-audio' ) }
					description={ __(
						'Either way, a post’s audio is made once and saved on your site as an MP3.',
						'text-to-audio'
					) }
				>
					<Tiles
						name="atlasvoice-audio-when"
						legend={ __( 'When audio is made', 'text-to-audio' ) }
						value={ onPublish ? 'publish' : 'play' }
						onChange={ ( value ) => set( 'when', value ) }
						options={ [
							{
								id: 'play',
								title: __(
									'On the first play',
									'text-to-audio'
								),
								text: __(
									'The first visitor who presses play waits while the audio is made. Posts nobody plays use no characters.',
									'text-to-audio'
								),
							},
							{
								id: 'publish',
								title: __(
									'When a post is published',
									'text-to-audio'
								),
								text: __(
									'The audio is made in the background when you publish or change a post, so no visitor waits.',
									'text-to-audio'
								),
							},
						] }
					/>
				</Section>

				{ onPublish && (
					<div className="atlasvoice-section">
						<Notice status="info" isDismissible={ false }>
							{ __(
								'With this choice, the text of every post you publish or change is sent to the AtlasVoice service to make its audio, and it counts against your characters. The background audio reads the post’s title and content; a page area you picked for a post type applies to audio made on the first play.',
								'text-to-audio'
							) }
						</Notice>
					</div>
				) }

				<Card>
					<CardBody>
						<p className="atlasvoice-weak">
							{ __(
								'Posts that are already published keep their audio. To make the audio of one of them now, use “Make audio” in All posts.',
								'text-to-audio'
							) }
						</p>
						<div className="atlasvoice-actions">
							<Button
								variant="secondary"
								onClick={ () => go( 'library:all' ) }
								__next40pxDefaultSize
							>
								{ __( 'Open All posts', 'text-to-audio' ) }
							</Button>
						</div>
					</CardBody>
				</Card>
			</Scroll>
		</Pane>
	);
}
