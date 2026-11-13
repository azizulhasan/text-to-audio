import { __, sprintf } from '@wordpress/i18n';
import { Button, ColorPalette, Dropdown } from '@wordpress/components';

/**
 * One colour as a compact row: its name, a swatch with the value, and a
 * palette that opens on click (the block editor's own pattern). The row
 * keeps a screen with several colours short.
 *
 * @param {Object}   props
 * @param {string}   props.label    What the colour is for.
 * @param {string}   props.value    The colour, as a hex value.
 * @param {Object[]} props.colors   Suggested colours: { name, color }.
 * @param {Function} props.onChange Called with the new hex colour.
 * @param {*}        props.note     A line under the row, e.g. the contrast.
 * @return {*} The row.
 */
export default function ColorRow( { label, value, colors, onChange, note } ) {
	return (
		<div className="atlasvoice-color-row">
			<div className="atlasvoice-color-row-main">
				<span className="atlasvoice-color-row-label">{ label }</span>
				<Dropdown
					popoverProps={ { placement: 'bottom-end' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="atlasvoice-color-row-button"
							variant="secondary"
							onClick={ onToggle }
							aria-expanded={ isOpen }
							aria-label={ sprintf(
								/* translators: 1: what the colour is for, 2: the colour value. */
								__( '%1$s: %2$s. Change', 'text-to-audio' ),
								label,
								value
							) }
						>
							<span
								className="atlasvoice-swatch"
								style={ { background: value } }
								aria-hidden="true"
							/>
							<span className="atlasvoice-mono">{ value }</span>
						</Button>
					) }
					renderContent={ () => (
						<div className="atlasvoice-color-row-palette">
							<ColorPalette
								colors={ colors }
								value={ value }
								// The palette's Clear button gives undefined; a colour is required here.
								onChange={ ( color ) =>
									color && onChange( color )
								}
								clearable={ false }
								enableAlpha={ false }
							/>
						</div>
					) }
				/>
			</div>
			{ note && (
				<div className="atlasvoice-color-row-note">{ note }</div>
			) }
		</div>
	);
}
