import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

import { useApp } from '../app-context';
import { classicHashFor } from '../routes';
import { Empty, Pane, Scroll } from '../shell/parts';

/**
 * Shown for a screen that is not rebuilt yet: one sentence and one action
 * that opens the same settings in the classic screens, so no setting is out
 * of reach while the new screens arrive.
 *
 * @return {*} The placeholder.
 */
export default function Placeholder() {
	const { boot, route } = useApp();

	return (
		<Pane canvas>
			<Scroll width={ 720 }>
				<Empty
					title={ __(
						'This screen is being rebuilt',
						'text-to-audio'
					) }
					action={
						<Button
							variant="secondary"
							href={
								boot.classicUrl + classicHashFor( route.id )
							}
							__next40pxDefaultSize
						>
							{ __(
								'Open it in the classic screens',
								'text-to-audio'
							) }
						</Button>
					}
				>
					{ __(
						'Your settings are safe. Until this screen is ready, you can change them in the classic screens.',
						'text-to-audio'
					) }
				</Empty>
			</Scroll>
		</Pane>
	);
}
