/**
 * Player › Look.
 *
 * The colours, shape, size and spacing of the player, with a preview that
 * changes as you choose. A form with a Save footer: nothing is written
 * until Save.
 *
 * It stores nothing new. The site saves each part in the field the classic
 * Customization screen uses (TTA\Player\Look), so both screens can be used
 * on the same site. A style, a shape and a size are shortcuts: each one only
 * fills in colours or numbers that can also be set one by one.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	Notice,
	RadioControl,
	RangeControl,
	Spinner,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

import useSettingsForm from '../hooks/use-settings-form';
import ColorRow from '../shell/ColorRow';
import ContrastLine from '../shell/ContrastLine';
import { Pane, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';

const ROUTE = 'tta/v1/look';

/**
 * The smallest and largest number of each part. The site checks the same
 * limits (TTA\Player\Look::fields()) and refuses a value outside them.
 */
export const LIMITS = {
	border: [ 0, 20 ],
	radius: [ 0, 200 ],
	height: [ 24, 200 ],
	font_size: [ 10, 100 ],
	width: [ 10, 100 ],
	margin_top: [ 0, 200 ],
	margin_bottom: [ 0, 200 ],
	margin_left: [ 0, 200 ],
	margin_right: [ 0, 200 ],
};

/**
 * Ready-made colour pairs. Each passes the contrast check for text.
 *
 * @return {Array} [ { id, name, background, text } ].
 */
export function stylePresets() {
	return [
		{
			id: 'teal',
			name: __( 'Classic teal', 'text-to-audio' ),
			background: '#184c53',
			text: '#ffffff',
		},
		{
			id: 'indigo',
			name: __( 'Indigo', 'text-to-audio' ),
			background: '#5646e5',
			text: '#ffffff',
		},
		{
			id: 'ink',
			name: __( 'Ink', 'text-to-audio' ),
			background: '#1e1e1e',
			text: '#ffffff',
		},
		{
			id: 'paper',
			name: __( 'Paper', 'text-to-audio' ),
			background: '#f2f0ea',
			text: '#1f2328',
		},
	];
}

/** Corner radius of each shape, in pixels. */
export const SHAPES = { square: 0, rounded: 10, pill: 100 };

/** Height and text size of each size, in pixels. */
export const SIZES = {
	small: { height: 40, font_size: 16 },
	medium: { height: 50, font_size: 18 },
	large: { height: 60, font_size: 22 },
};

/**
 * The shape the corner radius stands for, or "custom".
 *
 * @param {number} radius Corner radius in pixels.
 * @return {string} square, rounded, pill or custom.
 */
export function shapeOf( radius ) {
	const match = Object.keys( SHAPES ).find(
		( shape ) => SHAPES[ shape ] === radius
	);

	return match || 'custom';
}

/**
 * The size the height and text size stand for, or "custom".
 *
 * @param {Object} values The look on screen.
 * @return {string} small, medium, large or custom.
 */
export function sizeOf( values ) {
	const match = Object.keys( SIZES ).find(
		( size ) =>
			SIZES[ size ].height === values.height &&
			SIZES[ size ].font_size === values.font_size
	);

	return match || 'custom';
}

/**
 * A number of the look as a slider with a number field.
 *
 * @param {Object}   props
 * @param {string}   props.name     Part of the look, a key of LIMITS.
 * @param {string}   props.label    What the number is, with its unit.
 * @param {Object}   props.values   The look on screen.
 * @param {Function} props.onChange Receives the part and its new number.
 * @return {*} The control.
 */
function NumberRow( { name, label, values, onChange } ) {
	const [ min, max ] = LIMITS[ name ];

	return (
		<RangeControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ label }
			value={ values[ name ] }
			min={ min }
			max={ max }
			step={ 1 }
			onChange={ ( value ) => {
				// An emptied number field gives undefined: keep the last number.
				if ( Number.isFinite( value ) ) {
					onChange(
						name,
						Math.min( max, Math.max( min, Math.round( value ) ) )
					);
				}
			} }
		/>
	);
}

/**
 * The player as visitors will see it, before the look is saved. Pointing at
 * it, or moving the keyboard focus onto it, shows the hover colours.
 *
 * @param {Object} props
 * @param {Object} props.values The look on screen.
 * @return {*} The preview.
 */
function Preview( { values } ) {
	const [ hover, setHover ] = useState( false );

	return (
		<aside
			className="atlasvoice-preview"
			aria-label={ __( 'Preview', 'text-to-audio' ) }
		>
			<b className="atlasvoice-preview-title">
				{ __( 'Preview', 'text-to-audio' ) }
			</b>
			<div className="atlasvoice-preview-page">
				<div
					className="atlasvoice-look-player"
					// A picture of the player, not a control: it plays nothing here.
					role="img"
					aria-label={ __(
						'The player with this look',
						'text-to-audio'
					) }
					// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus shows the hover colours to keyboard users.
					tabIndex={ 0 }
					onMouseEnter={ () => setHover( true ) }
					onMouseLeave={ () => setHover( false ) }
					onFocus={ () => setHover( true ) }
					onBlur={ () => setHover( false ) }
					style={ {
						background: hover
							? values.hover_background
							: values.background,
						color: hover ? values.hover_text : values.text,
						width: values.width + '%',
						height: values.height,
						fontSize: values.font_size,
						border: `${ values.border }px solid ${ values.border_color }`,
						borderRadius: values.radius,
						marginTop: values.margin_top,
						marginBottom: values.margin_bottom,
						marginLeft: values.margin_left,
						marginRight: values.margin_right,
					} }
				>
					<span aria-hidden="true">▶</span>
					<span>{ __( 'Listen', 'text-to-audio' ) }</span>
				</div>
				<p>
					{ __(
						'The old mill stands by the river, as it has for two hundred years.',
						'text-to-audio'
					) }
				</p>
			</div>
			<p className="atlasvoice-weak">
				{ __(
					'Point at the player to see its hover colours. Visitors see this look after you save. On phones the player uses the full width.',
					'text-to-audio'
				) }
			</p>
		</aside>
	);
}

/**
 * The screen.
 *
 * @return {*} Player › Look.
 */
export default function PlayerLook() {
	const form = useSettingsForm(
		ROUTE,
		__(
			'Look saved. Visitors see the change on their next page load.',
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
								'The look could not be loaded: %s',
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

	const presets = stylePresets();
	const colors = presets.flatMap( ( preset ) => [
		{ name: preset.name, color: preset.background },
	] );
	const textColors = [
		{ name: __( 'White', 'text-to-audio' ), color: '#ffffff' },
		{ name: __( 'Near black', 'text-to-audio' ), color: '#1f2328' },
	];
	const shape = shapeOf( values.radius );
	const size = sizeOf( values );
	const custom = {
		label: __( 'Custom', 'text-to-audio' ),
		value: 'custom',
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
			<div className="atlasvoice-withpreview">
				<div className="atlasvoice-scroll">
					<div className="atlasvoice-pad atlasvoice-pad-form">
						<Section
							title={ __( 'Style', 'text-to-audio' ) }
							description={ __(
								'Start from a style, then fine-tune.',
								'text-to-audio'
							) }
						>
							<div
								className="atlasvoice-presets"
								role="group"
								aria-label={ __( 'Style', 'text-to-audio' ) }
							>
								{ presets.map( ( preset ) => {
									const on =
										preset.background ===
											values.background &&
										preset.text === values.text;

									return (
										<button
											key={ preset.id }
											type="button"
											className={
												'atlasvoice-preset' +
												( on ? ' is-on' : '' )
											}
											aria-pressed={ on }
											onClick={ () => {
												set(
													'background',
													preset.background
												);
												set( 'text', preset.text );
											} }
										>
											<span
												className="atlasvoice-swatch"
												style={ {
													background:
														preset.background,
												} }
												aria-hidden="true"
											/>
											{ preset.name }
										</button>
									);
								} ) }
							</div>
						</Section>

						<Section title={ __( 'Colours', 'text-to-audio' ) }>
							<Card>
								<CardBody>
									<div className="atlasvoice-form">
										<ColorRow
											label={ __(
												'Background',
												'text-to-audio'
											) }
											colors={ colors }
											value={ values.background }
											onChange={ ( value ) =>
												set( 'background', value )
											}
										/>
										<ColorRow
											label={ __(
												'Text and icons',
												'text-to-audio'
											) }
											colors={ textColors }
											value={ values.text }
											onChange={ ( value ) =>
												set( 'text', value )
											}
											note={
												<ContrastLine
													text={ values.text }
													background={
														values.background
													}
												/>
											}
										/>
									</div>
								</CardBody>
							</Card>
						</Section>

						<Section
							title={ __( 'Shape and size', 'text-to-audio' ) }
						>
							<Card>
								<CardBody>
									<div className="atlasvoice-form">
										<RadioControl
											label={ __(
												'Shape',
												'text-to-audio'
											) }
											selected={ shape }
											options={ [
												{
													label: __(
														'Square',
														'text-to-audio'
													),
													value: 'square',
												},
												{
													label: __(
														'Rounded',
														'text-to-audio'
													),
													value: 'rounded',
												},
												{
													label: __(
														'Pill',
														'text-to-audio'
													),
													value: 'pill',
												},
												...( shape === 'custom'
													? [ custom ]
													: [] ),
											] }
											onChange={ ( value ) =>
												value !== 'custom' &&
												set( 'radius', SHAPES[ value ] )
											}
										/>
										<RadioControl
											label={ __(
												'Size',
												'text-to-audio'
											) }
											selected={ size }
											options={ [
												{
													label: __(
														'Small',
														'text-to-audio'
													),
													value: 'small',
												},
												{
													label: __(
														'Medium',
														'text-to-audio'
													),
													value: 'medium',
												},
												{
													label: __(
														'Large',
														'text-to-audio'
													),
													value: 'large',
												},
												...( size === 'custom'
													? [ custom ]
													: [] ),
											] }
											onChange={ ( value ) => {
												if ( value !== 'custom' ) {
													set(
														'height',
														SIZES[ value ].height
													);
													set(
														'font_size',
														SIZES[ value ].font_size
													);
												}
											} }
										/>
										<NumberRow
											name="width"
											label={ __(
												'Width (% of the text column)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
									</div>
								</CardBody>
							</Card>
						</Section>

						<Card>
							<CardBody>
								<details className="atlasvoice-more">
									<summary>
										{ __(
											'More style options',
											'text-to-audio'
										) }
									</summary>
									<div className="atlasvoice-form">
										<ColorRow
											label={ __(
												'Hover background',
												'text-to-audio'
											) }
											colors={ colors }
											value={ values.hover_background }
											onChange={ ( value ) =>
												set( 'hover_background', value )
											}
										/>
										<ColorRow
											label={ __(
												'Hover text',
												'text-to-audio'
											) }
											colors={ textColors }
											value={ values.hover_text }
											onChange={ ( value ) =>
												set( 'hover_text', value )
											}
											note={
												<ContrastLine
													text={ values.hover_text }
													background={
														values.hover_background
													}
												/>
											}
										/>
										<ColorRow
											label={ __(
												'Border colour',
												'text-to-audio'
											) }
											colors={ colors }
											value={ values.border_color }
											onChange={ ( value ) =>
												set( 'border_color', value )
											}
										/>
										<NumberRow
											name="border"
											label={ __(
												'Border width (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="radius"
											label={ __(
												'Corner radius (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="height"
											label={ __(
												'Height (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="font_size"
											label={ __(
												'Text size (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="margin_top"
											label={ __(
												'Space above (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="margin_bottom"
											label={ __(
												'Space below (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="margin_left"
											label={ __(
												'Space on the left (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<NumberRow
											name="margin_right"
											label={ __(
												'Space on the right (px)',
												'text-to-audio'
											) }
											values={ values }
											onChange={ set }
										/>
										<p className="atlasvoice-weak">
											{ __(
												'Need more? Add CSS in Appearance → Customize → Additional CSS.',
												'text-to-audio'
											) }
										</p>
									</div>
								</details>
							</CardBody>
						</Card>
					</div>
				</div>
				<Preview values={ values } />
			</div>
		</Pane>
	);
}
