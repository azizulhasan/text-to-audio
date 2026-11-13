import { __, sprintf } from '@wordpress/i18n';
import { FormToggle } from '@wordpress/components';

import { useApp } from '../app-context';
import useModeSwitch, { MODE_LIVE, MODE_STAGING } from './use-mode-switch';

// The two words the site stores for the mode; kept here for the code that
// already imports them from the status bar.
export { MODE_LIVE, MODE_STAGING };

/**
 * The status bar: always shows whether visitors can hear the posts, and holds
 * the one "Live for visitors" switch. Going live and going back to staging
 * both ask first; the server keeps its own typed confirmation for going live.
 *
 * @return {*} The status bar.
 */
export default function StatusBar() {
	const { boot, isPro } = useApp();
	const { live, busy, ask } = useModeSwitch();

	return (
		<footer className="atlasvoice-status">
			<span
				className={
					'atlasvoice-status-item ' +
					( live ? 'is-live' : 'is-staging' )
				}
				role="status"
			>
				<span className="atlasvoice-dot" aria-hidden="true" />
				{ /* The full sentence on wide screens, the one word on phones. */ }
				<span className="atlasvoice-hide-sm">
					{ live
						? __(
								'Live: visitors hear your posts',
								'text-to-audio'
						  )
						: __(
								'Staging: only admins see the player',
								'text-to-audio'
						  ) }
				</span>
				<span className="atlasvoice-show-sm">
					{ live
						? __( 'Live', 'text-to-audio' )
						: __( 'Staging', 'text-to-audio' ) }
				</span>
			</span>
			<span className="atlasvoice-status-item atlasvoice-hide-sm">
				{ isPro && boot.proVersion
					? sprintf(
							/* translators: %s: Pro plugin version. */
							__( 'Pro %s', 'text-to-audio' ),
							boot.proVersion
					  )
					: sprintf(
							/* translators: %s: plugin version. */
							__( 'Free %s', 'text-to-audio' ),
							boot.version
					  ) }
			</span>
			<span className="atlasvoice-status-end">
				<label htmlFor="atlasvoice-live">
					{ __( 'Live for visitors', 'text-to-audio' ) }
				</label>
				<FormToggle
					id="atlasvoice-live"
					checked={ live }
					disabled={ busy }
					onChange={ ask }
				/>
			</span>
		</footer>
	);
}
