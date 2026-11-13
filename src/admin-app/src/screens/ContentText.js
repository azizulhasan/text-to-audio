/**
 * What is read › Text to read.
 *
 * What is read aloud besides the post content: the title, the excerpt, a
 * sentence before and after, and a few advanced switches. A form with a
 * Save footer: nothing is written until Save.
 *
 * It stores nothing new. The site saves each part in the field the classic
 * Settings screen uses (TTA\Content\Text). Two switches only show when a
 * player on the site applies them (the site says so); without Pro the
 * screen has one line about it and no disabled control.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	Notice,
	Spinner,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';

import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, ProNote, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';

const ROUTE = 'tta/v1/text';

/** The longest sentence the site accepts (TTA\Content\Text::TEXT_LENGTH). */
export const TEXT_LENGTH = 1000;

/**
 * The screen.
 *
 * @return {*} What is read › Text to read.
 */
export default function ContentText() {
	const { go } = useApp();
	const form = useSettingsForm(
		ROUTE,
		__(
			'Saved. Posts with a stored audio file keep their old audio until it is made again.',
			'text-to-audio'
		)
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
								'These settings could not be loaded: %s',
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

	/**
	 * One on/off part.
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
			<Scroll width={ 860 }>
				<Section
					title={ __( 'Read aloud', 'text-to-audio' ) }
					description={ __(
						'The content of the post is always read. Choose what is read with it.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								{ toggle(
									'title',
									__( 'The post title', 'text-to-audio' ),
									__(
										'Read before the content.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'excerpt',
									__( 'The excerpt', 'text-to-audio' ),
									__(
										'Read after the title.',
										'text-to-audio'
									)
								) }
								{ values.extras_available &&
									toggle(
										'numbers',
										__(
											'Say numbers as words',
											'text-to-audio'
										),
										__(
											'“1,284” is read as “one thousand two hundred eighty-four”.',
											'text-to-audio'
										)
									) }
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Before and after the post', 'text-to-audio' ) }
					description={ __(
						'A sentence that every post starts or ends with, for example the name of your site. It is only heard, never shown.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __(
										'Read before every post',
										'text-to-audio'
									) }
									rows={ 2 }
									maxLength={ TEXT_LENGTH }
									value={ values.intro || '' }
									onChange={ ( value ) =>
										set( 'intro', value )
									}
								/>
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __(
										'Read after every post',
										'text-to-audio'
									) }
									rows={ 2 }
									maxLength={ TEXT_LENGTH }
									value={ values.outro || '' }
									onChange={ ( value ) =>
										set( 'outro', value )
									}
								/>
							</div>
						</CardBody>
					</Card>
				</Section>

				<Card>
					<CardBody>
						<details className="atlasvoice-more">
							<summary>
								{ __( 'Advanced', 'text-to-audio' ) }
							</summary>
							<div className="atlasvoice-form">
								{ values.extras_available &&
									toggle(
										'as_seen',
										__(
											'Read the page as the visitor sees it',
											'text-to-audio'
										),
										__(
											'For page builders or translation plugins that change the text after the page loads.',
											'text-to-audio'
										)
									) }
								{ toggle(
									'wrapper',
									__(
										'Mark the post content with an extra wrapper',
										'text-to-audio'
									),
									__(
										'Helps the player find the text. Turn it off only when it breaks the layout of your theme.',
										'text-to-audio'
									)
								) }
								{ toggle(
									'status_column',
									__(
										'Audio status column in the list of posts',
										'text-to-audio'
									),
									__(
										'Shows in Posts → All Posts whether a post has audio.',
										'text-to-audio'
									)
								) }
							</div>
						</details>
					</CardBody>
				</Card>

				{ ! values.extras_available && (
					<ProNote onSeePro={ () => go( 'account:plans' ) }>
						{ __(
							'Saying numbers as words, and reading the page as the visitor sees it, are part of AtlasVoice Pro.',
							'text-to-audio'
						) }
					</ProNote>
				) }
			</Scroll>
		</Pane>
	);
}
