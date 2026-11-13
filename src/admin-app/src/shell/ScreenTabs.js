import { TabPanel } from '@wordpress/components';

import { useApp } from '../app-context';

/**
 * The tabs of a screen, as WordPress's own TabPanel.
 *
 * The route decides which tab is open, so a tab has an address and the Back
 * button works. TabPanel selects a tab on click before we can ask about
 * unsaved changes; `attempt` remounts it on the route's tab when the user
 * chooses "Keep editing".
 *
 * @param {Object}   props
 * @param {Object[]} props.tabs    Tabs that exist on this site ({ id, label }).
 * @param {number}   props.attempt Changes when a navigation was refused.
 * @return {*} The tab bar.
 */
export default function ScreenTabs( { tabs, attempt } ) {
	const { route, go } = useApp();

	return (
		<div className="atlasvoice-tabs">
			<div className="atlasvoice-tabs-scroll">
				<TabPanel
					key={ route.id + ':' + attempt }
					tabs={ tabs.map( ( tab ) => ( {
						name: tab.id,
						title: tab.label,
					} ) ) }
					initialTabName={ route.tab }
					onSelect={ ( name ) => {
						if ( name !== route.tab ) {
							go( route.screen + ':' + name );
						}
					} }
				>
					{ () => null }
				</TabPanel>
			</div>
		</div>
	);
}
