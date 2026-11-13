import { __ } from '@wordpress/i18n';
import { Button, Card, CardBody } from '@wordpress/components';
import { useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { classicHashFor } from '../routes';
import { Pane, Scroll, Section } from '../shell/parts';

/**
 * Site health › Advanced.
 *
 * The switch back to the classic screens (kept until 2.7) and a link to the
 * classic Settings screen. The advanced switches themselves are in
 * SiteAdvancedTab, which shows these sections under its form.
 *
 * @param {Object}  props
 * @param {boolean} props.bare Only the sections, for use inside another screen.
 * @return {*} The screen, or its sections.
 */
export default function SiteAdvanced( { bare = false } ) {
	const { boot, route, notify } = useApp();
	const [ busy, setBusy ] = useState( false );

	const useClassic = async () => {
		setBusy( true );
		try {
			const result = await request( boot, 'tta/v1/admin-ui', {
				method: 'POST',
				data: { ui: 'classic' },
			} );
			// A full page load: the classic dashboard is a different script.
			window.location.assign( result.url );
		} catch ( error ) {
			setBusy( false );
			notify( error.message, 'error' );
		}
	};

	const sections = (
		<>
			<Section
				title={ __( 'Classic screens', 'text-to-audio' ) }
				description={ __(
					'The screens AtlasVoice had before this version. Both use the same saved settings, so you can switch back and forth safely. The classic screens stay until version 2.7.',
					'text-to-audio'
				) }
			>
				<Card>
					<CardBody>
						<Button
							variant="secondary"
							isBusy={ busy }
							disabled={ busy }
							onClick={ useClassic }
							__next40pxDefaultSize
						>
							{ __( 'Use the classic screens', 'text-to-audio' ) }
						</Button>
					</CardBody>
				</Card>
			</Section>
			<Section
				title={ __( 'The same settings, classic', 'text-to-audio' ) }
				description={ __(
					'The classic Settings screen shows these advanced settings too, and a few that are not moved yet.',
					'text-to-audio'
				) }
			>
				<Button
					variant="link"
					href={ boot.classicUrl + classicHashFor( route.id ) }
				>
					{ __(
						'Open these settings in the classic screens',
						'text-to-audio'
					) }
				</Button>
			</Section>
		</>
	);

	// Inside the Advanced tab the sections sit under the settings form.
	if ( bare ) {
		return sections;
	}

	return (
		<Pane canvas>
			<Scroll width={ 760 }>{ sections }</Scroll>
		</Pane>
	);
}
