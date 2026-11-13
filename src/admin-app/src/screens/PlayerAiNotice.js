/**
 * Player › AI notice.
 *
 * An optional line next to the player that tells listeners the voice is
 * made by AI. Off until the owner turns it on. A form with a Save footer
 * and a preview: nothing is written until Save.
 *
 * The settings are one small option of their own (TTA\Player\AI_Notice).
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	Notice,
	RadioControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';

const ROUTE = 'tta/v1/ai-notice';

/** The longest notice the site accepts (TTA\Player\AI_Notice::TEXT_LENGTH). */
export const TEXT_LENGTH = 200;

/**
 * A short article with the player and the notice, as visitors will see it.
 *
 * @param {Object} props
 * @param {Object} props.values The settings on screen.
 * @return {*} The preview.
 */
function Preview( { values } ) {
	const text = values.text || values.default_text;
	const notice = values.enabled && (
		<div className="atlasvoice-ai-notice-preview">{ text }</div>
	);

	return (
		<aside
			className="atlasvoice-preview"
			aria-label={ __( 'Preview', 'text-to-audio' ) }
		>
			<b className="atlasvoice-preview-title">
				{ __( 'Preview', 'text-to-audio' ) }
			</b>
			<div className="atlasvoice-preview-page">
				{ values.position === 'before' && notice }
				<div className="atlasvoice-preview-player" aria-hidden="true">
					<span>▶</span>
					{ __( 'Listen', 'text-to-audio' ) }
				</div>
				{ values.position !== 'before' && notice }
				<p>
					{ __(
						'The old mill stands by the river, as it has for two hundred years.',
						'text-to-audio'
					) }
				</p>
			</div>
			<p className="atlasvoice-weak">
				{ values.enabled
					? __(
							'The notice is plain text, so screen readers read it with the page. Visitors see it after you save.',
							'text-to-audio'
					  )
					: __(
							'The notice is off, so the player shows without it.',
							'text-to-audio'
					  ) }
			</p>
		</aside>
	);
}

/**
 * The screen.
 *
 * @return {*} Player › AI notice.
 */
export default function PlayerAiNotice() {
	const form = useSettingsForm(
		ROUTE,
		__(
			'AI notice saved. Visitors see the change on their next page load.',
			'text-to-audio'
		)
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-pad">
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
								'The AI notice could not be loaded: %s',
								'text-to-audio'
							),
							form.failure
						) }
					</Notice>
				</div>
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
			<div className="atlasvoice-withpreview">
				<div className="atlasvoice-scroll">
					<div className="atlasvoice-pad atlasvoice-pad-form">
						<Section
							title={ __( 'AI notice', 'text-to-audio' ) }
							description={ __(
								'Tell listeners the voice is made by AI. Optional, and off until you turn it on. Some public-sector and health sites need it.',
								'text-to-audio'
							) }
						>
							<Card>
								<CardBody>
									<div className="atlasvoice-form">
										<ToggleControl
											__nextHasNoMarginBottom
											label={ __(
												'Show the AI notice',
												'text-to-audio'
											) }
											help={ __(
												'A line of text next to every player.',
												'text-to-audio'
											) }
											checked={ !! values.enabled }
											onChange={ ( value ) =>
												set( 'enabled', value )
											}
										/>
										{ values.enabled && (
											<>
												<TextControl
													__nextHasNoMarginBottom
													__next40pxDefaultSize
													label={ __(
														'Notice text',
														'text-to-audio'
													) }
													help={ __(
														'Leave it empty to use the sentence shown in grey. That sentence appears in the language of the page; your own text appears as you type it.',
														'text-to-audio'
													) }
													value={ values.text }
													placeholder={
														values.default_text
													}
													maxLength={ TEXT_LENGTH }
													onChange={ ( value ) =>
														set( 'text', value )
													}
												/>
												<RadioControl
													label={ __(
														'Position',
														'text-to-audio'
													) }
													selected={ values.position }
													options={ [
														{
															label: __(
																'Above the player',
																'text-to-audio'
															),
															value: 'before',
														},
														{
															label: __(
																'Below the player',
																'text-to-audio'
															),
															value: 'after',
														},
													] }
													onChange={ ( value ) =>
														set( 'position', value )
													}
												/>
											</>
										) }
									</div>
								</CardBody>
							</Card>
						</Section>
						<p className="atlasvoice-weak">
							{ __(
								'This is information, not legal advice. Check your own obligations, for example under the EU AI Act.',
								'text-to-audio'
							) }
						</p>
					</div>
				</div>
				<Preview values={ values } />
			</div>
		</Pane>
	);
}
