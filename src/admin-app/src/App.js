import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

import { BrandTheme } from './theme';

/**
 * The app root.
 *
 * TTS-372 delivers the build, the tokens and the brand layer. The frame and
 * the screens arrive with TTS-373 onward, so for now this shows one card that
 * proves the stack: WordPress's own components in the AtlasVoice colours.
 *
 * @param {Object} props
 * @param {Object} props.boot Data printed by PHP (see TTA_Admin\Admin_App).
 * @return {*} The app.
 */
export default function App( { boot } ) {
	return (
		<BrandTheme>
			<div className="atlasvoice-root">
				<div className="atlasvoice-boot">
					<div className="atlasvoice-boot__brand">
						<img
							src={ boot.logoUrl }
							width="40"
							height="40"
							alt=""
						/>
						<h1 className="atlasvoice-boot__title">
							Atlas<span>Voice</span>
						</h1>
					</div>
					<p className="atlasvoice-boot__text">
						{ __(
							'The new AtlasVoice screens are being built. Your settings are safe, and the classic screens work as before.',
							'text-to-audio'
						) }
					</p>
					<Button
						variant="primary"
						href={ boot.classicUrl }
						__next40pxDefaultSize
					>
						{ __( 'Open the classic screens', 'text-to-audio' ) }
					</Button>
				</div>
			</div>
		</BrandTheme>
	);
}
