/**
 * WordPress' token field with a help line under it.
 *
 * FormTokenField only gained a `help` prop in a later WordPress version
 * than the oldest one AtlasVoice supports, so the line is drawn here: it
 * shows on every version, and never twice.
 *
 * @param {Object} props      Everything FormTokenField takes.
 * @param {*}      props.help A line under the field.
 * @return {*} The field.
 */
import { FormTokenField } from '@wordpress/components';

export default function TokenField( { help, ...props } ) {
	return (
		<div className="atlasvoice-token">
			<FormTokenField
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				__experimentalShowHowTo={ false }
				{ ...props }
			/>
			{ help && (
				<p className="atlasvoice-weak atlasvoice-token-help">
					{ help }
				</p>
			) }
		</div>
	);
}
