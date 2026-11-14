/**
 * Insights › Tracking.
 *
 * Whether plays are counted, whether the country of a listener is looked
 * up, and for which posts. A form with a Save footer: nothing is written
 * until Save.
 *
 * It stores nothing new. The site saves each part in the field the classic
 * Analytics screen uses (TTA\Insights\Tracking). The country lookup sends
 * visitor IP addresses to a service outside the site, so it is off until
 * the owner turns it on, and the screen says what it does before that.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	Notice,
	RadioControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';

import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import TokenField from '../shell/TokenField';
import { isPostNumber } from '../util/post-number';

const ROUTE = 'tta/v1/tracking';
const ALL = 'all';

/**
 * The screen.
 *
 * @return {*} Insights › Tracking.
 */
export default function InsightsTracking() {
	const form = useSettingsForm(
		ROUTE,
		__( 'Tracking saved.', 'text-to-audio' )
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
								'The tracking settings could not be loaded: %s',
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

	const posts = Array.isArray( values.posts ) ? values.posts : [];
	const everyPost = posts.includes( ALL );
	// "Only posts I choose" with no post chosen cannot be saved: nothing would be counted.
	const complete = ! values.count_plays || posts.length > 0;

	return (
		<Pane
			canvas
			footer={
				<SaveBar
					dirty={ form.dirty && complete }
					saving={ form.saving }
					onSave={ form.save }
				/>
			}
		>
			<Scroll width={ 760 }>
				<Section
					title={ __( 'Counting plays', 'text-to-audio' ) }
					description={ __(
						'Plays and listening time are counted on your own site, without cookies. A listener is told apart by a browser identifier, not by a name, an email or an IP address.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __(
										'Count plays',
										'text-to-audio'
									) }
									help={ __(
										'Off: nothing about visitors is stored, and Insights stays empty.',
										'text-to-audio'
									) }
									checked={ !! values.count_plays }
									onChange={ ( value ) =>
										set( 'count_plays', value )
									}
								/>
								{ values.count_plays && (
									<>
										<RadioControl
											label={ __(
												'Posts to track',
												'text-to-audio'
											) }
											selected={
												everyPost ? 'all' : 'some'
											}
											options={ [
												{
													label: __(
														'All posts',
														'text-to-audio'
													),
													value: 'all',
												},
												{
													label: __(
														'Only posts I choose',
														'text-to-audio'
													),
													value: 'some',
												},
											] }
											onChange={ ( choice ) =>
												set(
													'posts',
													choice === 'all'
														? [ ALL ]
														: []
												)
											}
										/>
										{ ! everyPost && (
											<TokenField
												__nextHasNoMarginBottom
												__next40pxDefaultSize
												__experimentalShowHowTo={
													false
												}
												label={ __(
													'Posts, by number',
													'text-to-audio'
												) }
												help={
													posts.length
														? __(
																'Type the number (ID) of a post and press Enter.',
																'text-to-audio'
														  )
														: __(
																'Choose at least one post, or choose All posts.',
																'text-to-audio'
														  )
												}
												value={ posts.map( String ) }
												__experimentalValidateInput={
													isPostNumber
												}
												onChange={ ( tokens ) =>
													set( 'posts', [
														...new Set(
															tokens
																.map(
																	( token ) =>
																		parseInt(
																			typeof token ===
																				'string'
																				? token
																				: token.value,
																			10
																		)
																)
																.filter(
																	( id ) =>
																		id > 0
																)
														),
													] )
												}
											/>
										) }
									</>
								) }
							</div>
						</CardBody>
					</Card>
				</Section>

				{ values.count_plays && (
					<Section
						title={ __( 'Listener country', 'text-to-audio' ) }
					>
						<Card>
							<CardBody>
								<div className="atlasvoice-form">
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __(
											'Show the country and city of listeners',
											'text-to-audio'
										) }
										help={ __(
											'When on, the IP address of a visitor who presses play is sent to a lookup service outside your site (ip-api.com, or ipinfo.io when that fails). Off: no address leaves your site.',
											'text-to-audio'
										) }
										checked={ !! values.listener_location }
										onChange={ ( value ) =>
											set( 'listener_location', value )
										}
									/>
									{ values.listener_location && (
										<Notice
											status="warning"
											isDismissible={ false }
										>
											{ __(
												'Say in your privacy policy that visitor IP addresses are sent to a lookup service to find the country.',
												'text-to-audio'
											) }
										</Notice>
									) }
								</div>
							</CardBody>
						</Card>
					</Section>
				) }
			</Scroll>
		</Pane>
	);
}
