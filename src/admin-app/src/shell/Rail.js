import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

import { useApp } from '../app-context';
import { GROUPS, SCREENS } from '../routes';
import { AppIcon, ProBadge } from './parts';

/**
 * The left rail: the ten destinations in the order people work, grouped
 * "Set up", "Every day" and "Look after". Setup shows until it is finished.
 *
 * Below 782px the rail is a slide-in menu opened from the header.
 *
 * @param {Object}   props
 * @param {boolean}  props.open    Whether the slide-in menu is open (phones).
 * @param {Function} props.onClose Closes the slide-in menu.
 * @return {*} The rail.
 */
export default function Rail( { open, onClose } ) {
	const { boot, isPro, route, go } = useApp();

	const visible = SCREENS.filter(
		( screen ) => screen.id !== 'setup' || ! boot.setupFinished
	);
	const sections = [
		{ id: 'top', items: visible.filter( ( screen ) => ! screen.group ) },
		...GROUPS.map( ( group ) => ( {
			...group,
			items: visible.filter( ( screen ) => screen.group === group.id ),
		} ) ),
	];

	const open_ = ( id ) => {
		go( id );
		onClose();
	};

	return (
		<>
			{ open && (
				// A pointer shortcut; the Close button in the menu serves the keyboard.
				// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
				<div
					className="atlasvoice-rail-backdrop"
					onClick={ onClose }
					aria-hidden="true"
				/>
			) }
			<aside className={ 'atlasvoice-rail' + ( open ? ' is-open' : '' ) }>
				<div className="atlasvoice-rail-brand">
					<img
						className="atlasvoice-logo"
						src={ boot.logoUrl }
						width="32"
						height="32"
						alt=""
					/>
					<div className="atlasvoice-rail-label">
						<b>
							AtlasVoice
							{ isPro && (
								<>
									{ ' ' }
									<ProBadge />
								</>
							) }
						</b>
						<small>
							{ isPro && boot.proVersion
								? sprintf(
										/* translators: 1: free plugin version, 2: Pro plugin version. */
										__(
											'%1$s · Pro %2$s',
											'text-to-audio'
										),
										boot.version,
										boot.proVersion
								  )
								: sprintf(
										/* translators: %s: plugin version. */
										__( 'Free %s', 'text-to-audio' ),
										boot.version
								  ) }
						</small>
					</div>
					{ open && (
						<Button
							className="atlasvoice-rail-close"
							icon={ <AppIcon name="close" /> }
							label={ __( 'Close menu', 'text-to-audio' ) }
							onClick={ onClose }
						/>
					) }
				</div>
				<nav
					className="atlasvoice-rail-nav"
					aria-label={ __( 'AtlasVoice', 'text-to-audio' ) }
				>
					{ sections.map( ( section ) => (
						<div key={ section.id }>
							{ section.label && (
								<div className="atlasvoice-rail-group">
									<span className="atlasvoice-rail-label">
										{ section.label }
									</span>
								</div>
							) }
							{ section.items.map( ( screen ) => {
								const current = route.screen === screen.id;

								return (
									<Button
										key={ screen.id }
										className={
											'atlasvoice-rail-item' +
											( current ? ' is-current' : '' )
										}
										// The label is hidden on the icon-only rail; the title names the icon.
										title={ screen.label }
										aria-current={
											current ? 'page' : undefined
										}
										onClick={ () => open_( screen.id ) }
									>
										<AppIcon name={ screen.icon } />
										<span className="atlasvoice-rail-label">
											{ screen.label }
										</span>
									</Button>
								);
							} ) }
						</div>
					) ) }
				</nav>
				{ ! isPro && (
					<div className="atlasvoice-rail-foot atlasvoice-rail-label">
						<Button
							variant="secondary"
							className="atlasvoice-rail-upgrade"
							onClick={ () => open_( 'account:plans' ) }
						>
							{ __( 'Upgrade to Pro', 'text-to-audio' ) }
						</Button>
						<span className="atlasvoice-weak">
							{ __(
								'You are on the Free plan',
								'text-to-audio'
							) }
						</span>
					</div>
				) }
			</aside>
		</>
	);
}
