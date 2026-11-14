import { __ } from '@wordpress/i18n';
import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';

import { useApp } from '../app-context';
import { HelpButton } from '../help/HelpDrawer';
import { safeLink } from '../help/topics';
import { getScreen } from '../routes';
import NoticesBell from './NoticesBell';
import { AppIcon } from './parts';
import Search from './Search';

/**
 * The top bar: where you are, then help and notices.
 *
 * The middle column holds the search box; on phones it has a row of its own.
 *
 * @param {Object}   props
 * @param {Function} props.onMenu Opens the slide-in rail on phones.
 * @return {*} The header.
 */
export default function Header( { onMenu } ) {
	const { boot, route, go } = useApp();
	const supportUrl = safeLink( boot.supportUrl );

	return (
		<header className="atlasvoice-header">
			<div className="atlasvoice-header-title">
				<Button
					className="atlasvoice-menu-btn"
					icon={ <AppIcon name="menu" /> }
					label={ __( 'AtlasVoice menu', 'text-to-audio' ) }
					onClick={ onMenu }
				/>
				<h1>{ getScreen( route.screen ).label }</h1>
			</div>
			<div className="atlasvoice-header-search">
				<Search />
			</div>
			<div className="atlasvoice-header-end">
				<HelpButton />
				<NoticesBell />
				<Dropdown
					popoverProps={ { placement: 'bottom-end' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							icon={ <AppIcon name="help" /> }
							label={ __( 'Help', 'text-to-audio' ) }
							onClick={ onToggle }
							aria-expanded={ isOpen }
							showTooltip
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									onClose();
									go( 'help:docs' );
								} }
							>
								{ __( 'Documentation', 'text-to-audio' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => {
									onClose();
									go( 'help:moved' );
								} }
							>
								{ __( 'Where things moved', 'text-to-audio' ) }
							</MenuItem>
							{ supportUrl && (
								<MenuItem
									icon={ <AppIcon name="external" /> }
									href={ supportUrl }
									target="_blank"
									rel="noreferrer"
								>
									{ __( 'Contact support', 'text-to-audio' ) }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				/>
			</div>
		</header>
	);
}
