import React from 'react';
import { NavLink } from 'react-router-dom';

import './DashboardSideNav.css'; // Make sure to import the CSS

export default function DashboardSideNav({ isProVersion }) {
	const style = {
		side_nav: {
			flexBasis: '150px',
		},
	};

	const getNavLinkClass = ({ isActive }) =>
		isActive ? 'nav-link active' : 'nav-link';

	return (
		<div id='ttaTtaLayoutSidenav_nav' style={style.side_nav}>
			<nav
				className='tta-sidenav accordion tta-sidenav-dark text-white'
				id='sidenavAccordion'>
				<div className='tta-sidenav-menu'>
					<div className='nav'>
						{/* Settings menu */}
						<NavLink className={getNavLinkClass} to={'/'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-admin-settings"></span>
							</div>
							Settings
						</NavLink>
						<NavLink className={getNavLinkClass} to={'/integrations'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-admin-plugins"></span>
							</div>
							Integrations
						</NavLink>
						<NavLink className={getNavLinkClass} to={'/customize'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-admin-customizer"></span>
							</div>
							Customization
						</NavLink>
						{/* <NavLink className={getNavLinkClass} to={'/recording'}>
							<div className='sb-nav-link-icon'>
								<span class="dashicons dashicons-microphone"></span>
							</div>
							Recording
						</NavLink> */}
						<NavLink className={getNavLinkClass} to={'/listening'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-controls-volumeon"></span>
							</div>
							Listening
						</NavLink>
						<NavLink className={getNavLinkClass} to={'/faq'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-media-document"></span>
							</div>
							Docs
						</NavLink>
						{/* <NavLink className={getNavLinkClass} to={'/analitics'}>
							<div className='sb-nav-link-icon'>
								<span class="dashicons dashicons-chart-bar"></span>
							</div>
							Analytics Pro
						</NavLink> */}
					</div>
				</div>
			</nav>
		</div>
	);
}
