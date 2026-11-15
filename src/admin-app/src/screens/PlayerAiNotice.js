/**
 * Player › AI notice.
 *
 * An optional line next to the player that tells listeners the voice is
 * made by AI. Off until the owner turns it on. A form with a Save footer
 * and a preview: nothing is written until Save.
 *
 * The settings are one small option of their own (TTA\Player\AI_Notice).
 *
 * Below it, the optional line "Voiced by AtlasVoice" (TTA\Player\Credit):
 * also off until the owner turns it on, saved by the same Save button, and
 * offered only where the free plugin renders the player itself.
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
const CREDIT_ROUTE = 'tta/v1/credit';

/** The longest notice the site accepts (TTA\Player\AI_Notice::TEXT_LENGTH). */
export const TEXT_LENGTH = 200;

/**
 * A short article with the player and the notice, as visitors will see it.
 *
 * @param {Object} props
 * @param {Object} props.values The settings on screen.
 * @param {string} props.credit The credit line, when it is turned on.
 * @return {*} The preview.
 */
function Preview( { values, credit } ) {
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
				{ credit && (
					<div className="atlasvoice-credit-preview">{ credit }</div>
				) }
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
	const credit = useSettingsForm(
		CREDIT_ROUTE,
		__(
			'Credit line saved. Visitors see the change on their next page load.',
			'text-to-audio'
		)
	);
	const creditOn = !! credit.values?.enabled;
	const saveAll = () => {
		form.save();
		credit.save();
	};

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
					dirty={ form.dirty || credit.dirty }
					saving={ form.saving || credit.saving }
					onSave={ saveAll }
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
						{ credit.failure && (
							<Notice
								status="error"
								isDismissible={ false }
								actions={ [
									{
										label: __(
											'Try again',
											'text-to-audio'
										),
										onClick: credit.reload,
									},
								] }
							>
								{ sprintf(
									/* translators: %s: error message from the site. */
									__(
										'The credit line could not be loaded: %s',
										'text-to-audio'
									),
									credit.failure
								) }
							</Notice>
						) }
						{ credit.values?.available && (
							<Section
								title={ __( 'Credit line', 'text-to-audio' ) }
								description={ __(
									'Say under the player that AtlasVoice made the voice. Optional, and off until you turn it on.',
									'text-to-audio'
								) }
							>
								<Card>
									<CardBody>
										<div className="atlasvoice-form">
											<ToggleControl
												__nextHasNoMarginBottom
												label={ sprintf(
													/* translators: %s: the line, "Voiced by AtlasVoice". */
													__(
														'Show “%s” under the player',
														'text-to-audio'
													),
													credit.values.text
												) }
												help={ __(
													'Plain text without a link, under the natural-voice player only.',
													'text-to-audio'
												) }
												checked={ creditOn }
												onChange={ ( value ) =>
													credit.set(
														'enabled',
														value
													)
												}
											/>
											{ credit.saved.enabled &&
												! credit.saved.showing && (
													<p className="atlasvoice-weak">
														{ __(
															'Your site does not use the natural voice now, so visitors do not see the line.',
															'text-to-audio'
														) }
													</p>
												) }
										</div>
									</CardBody>
								</Card>
							</Section>
						) }
					</div>
				</div>
				<Preview
					values={ values }
					credit={
						credit.values?.available && creditOn
							? credit.values.text
							: ''
					}
				/>
			</div>
		</Pane>
	);
}
