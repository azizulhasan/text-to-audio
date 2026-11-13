/**
 * Player › Placement.
 *
 * Where the player sits in a post, whether it follows the reader while
 * scrolling, who sees it, and who may download the audio. A form with a
 * Save footer: nothing is written until Save.
 *
 * It stores nothing new. The site saves each choice in the field the
 * classic Customization and Settings screens use (TTA\Player\Placement),
 * so both screens can be used on the same site.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	RadioControl,
	Spinner,
} from '@wordpress/components';

import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, ProNote, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import Tiles from '../shell/Tiles';

const ROUTE = 'tta/v1/placement';
const EVERYONE = 'all';

/**
 * The positions, in words.
 *
 * @return {Array} [ { id, title, text } ].
 */
export function positionOptions() {
	return [
		{
			id: 'before_content',
			title: __( 'Before the content', 'text-to-audio' ),
			text: __( 'Most people press play here.', 'text-to-audio' ),
		},
		{
			id: 'after_content',
			title: __( 'After the content', 'text-to-audio' ),
			text: __( 'For readers who finish first.', 'text-to-audio' ),
		},
		{
			id: 'manual',
			title: __( 'Only where I add it', 'text-to-audio' ),
			text: __(
				'With the shortcode, the block or the Elementor widget.',
				'text-to-audio'
			),
		},
	];
}

/**
 * The places the player can dock to, in words.
 *
 * @return {Array} [ { id, title, text } ].
 */
export function dockOptions() {
	return [
		{
			id: 'bottom_fixed',
			title: __( 'Bottom, full width', 'text-to-audio' ),
			text: __( 'A bar along the bottom edge.', 'text-to-audio' ),
		},
		{
			id: 'bottom_right',
			title: __( 'Bottom right', 'text-to-audio' ),
			text: __( 'In the corner, out of the text.', 'text-to-audio' ),
		},
		{
			id: 'bottom_left',
			title: __( 'Bottom left', 'text-to-audio' ),
			text: __( 'In the other corner.', 'text-to-audio' ),
		},
		{
			id: 'sticky_top',
			title: __( 'Top of the screen', 'text-to-audio' ),
			text: __( 'Stays under the top edge.', 'text-to-audio' ),
		},
		{
			id: 'none',
			title: __( 'Don’t follow', 'text-to-audio' ),
			text: __(
				'The player stays where it is in the post.',
				'text-to-audio'
			),
		},
	];
}

/**
 * Everyone, or only some user roles.
 *
 * @param {Object}   props
 * @param {string}   props.name     Unique name on the screen.
 * @param {string}   props.label    What is being allowed.
 * @param {string}   props.help     What a list of roles means for visitors.
 * @param {Array}    props.value    [ 'all' ] or a list of role ids.
 * @param {Array}    props.roles    [ { id, name } ] of this site.
 * @param {Function} props.onChange Receives the new list.
 * @return {*} The control.
 */
function RoleChoice( { name, label, help, value, roles, onChange } ) {
	const everyone = value.includes( EVERYONE );
	const choosable = roles.filter( ( role ) => role.id !== EVERYONE );

	const toggle = ( id, on ) => {
		const chosen = new Set( value );
		if ( on ) {
			chosen.add( id );
		} else {
			chosen.delete( id );
		}
		// Kept in the order of the site's roles, so the same choice is the same list.
		onChange(
			choosable
				.map( ( role ) => role.id )
				.filter( ( roleId ) => chosen.has( roleId ) )
		);
	};

	return (
		<div className="atlasvoice-form">
			<RadioControl
				label={ label }
				selected={ everyone ? 'everyone' : 'roles' }
				options={ [
					{
						label: __( 'Everyone', 'text-to-audio' ),
						value: 'everyone',
					},
					{
						label: __(
							'Only logged-in people with these roles',
							'text-to-audio'
						),
						value: 'roles',
					},
				] }
				onChange={ ( choice ) =>
					onChange( choice === 'everyone' ? [ EVERYONE ] : [] )
				}
			/>
			{ ! everyone && (
				<fieldset className="atlasvoice-checks">
					<legend className="screen-reader-text">
						{ sprintf(
							/* translators: %s: what is being allowed, e.g. "Show the player to". */
							__( '%s: roles', 'text-to-audio' ),
							label
						) }
					</legend>
					{ choosable.map( ( role ) => (
						<CheckboxControl
							key={ role.id }
							__nextHasNoMarginBottom
							id={ name + '-' + role.id }
							label={ role.name }
							checked={ value.includes( role.id ) }
							onChange={ ( on ) => toggle( role.id, on ) }
						/>
					) ) }
					<p className="atlasvoice-weak atlasvoice-checks-help">
						{ value.length
							? help
							: __(
									'Choose at least one role, or choose Everyone.',
									'text-to-audio'
							  ) }
					</p>
				</fieldset>
			) }
		</div>
	);
}

/**
 * The screen.
 *
 * @return {*} Player › Placement.
 */
export default function PlayerPlacement() {
	const { go, isPro } = useApp();
	const form = useSettingsForm(
		ROUTE,
		__(
			'Placement saved. Visitors see the change on their next page load.',
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
								'The placement could not be loaded: %s',
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

	const roles = Array.isArray( values.roles ) ? values.roles : [];
	const showTo = Array.isArray( values.show_to ) ? values.show_to : [];
	const download = Array.isArray( values.download ) ? values.download : [];
	// A list of roles with nothing ticked cannot be saved: nobody would be allowed.
	const complete =
		showTo.length > 0 &&
		( ! values.download_available || download.length > 0 );

	let downloadPart = null;
	if ( values.download_available ) {
		downloadPart = (
			<RoleChoice
				name="atlasvoice-download"
				label={ __( 'Allow audio download for', 'text-to-audio' ) }
				help={ __(
					'Only these roles get the download button on the player.',
					'text-to-audio'
				) }
				value={ download }
				roles={ roles }
				onChange={ ( value ) => set( 'download', value ) }
			/>
		);
	} else if ( isPro ) {
		downloadPart = (
			<p className="atlasvoice-weak">
				{ __(
					'Audio download: the voice in use reads in the browser and stores no file, so there is nothing to download.',
					'text-to-audio'
				) }
			</p>
		);
	}

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
			<Scroll width={ 860 }>
				<Section
					title={ __( 'Where it sits in the post', 'text-to-audio' ) }
				>
					<Tiles
						name="atlasvoice-position"
						legend={ __(
							'Where it sits in the post',
							'text-to-audio'
						) }
						value={ values.position }
						options={ positionOptions() }
						onChange={ ( value ) => set( 'position', value ) }
					/>
				</Section>

				<Section
					title={ __( 'While scrolling', 'text-to-audio' ) }
					description={ __(
						'When the reader scrolls past the player, it docks to the edge of the screen, so it can be paused at any time. Scrolling back returns it to its place.',
						'text-to-audio'
					) }
				>
					<Tiles
						name="atlasvoice-dock"
						legend={ __( 'While scrolling', 'text-to-audio' ) }
						value={ values.dock }
						options={ dockOptions() }
						onChange={ ( value ) => set( 'dock', value ) }
					/>
				</Section>

				<Section title={ __( 'Who gets it', 'text-to-audio' ) }>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<RoleChoice
									name="atlasvoice-show"
									label={ __(
										'Show the player to',
										'text-to-audio'
									) }
									help={ __(
										'Visitors who are not logged in do not see the player.',
										'text-to-audio'
									) }
									value={ showTo }
									roles={ roles }
									onChange={ ( value ) =>
										set( 'show_to', value )
									}
								/>
								{ downloadPart }
							</div>
						</CardBody>
					</Card>
				</Section>

				{ ! values.download_available && ! isPro && (
					<ProNote onSeePro={ () => go( 'account:plans' ) }>
						{ __(
							'A download button for the audio file, and who may use it, is part of AtlasVoice Pro.',
							'text-to-audio'
						) }
					</ProNote>
				) }
			</Scroll>
		</Pane>
	);
}
