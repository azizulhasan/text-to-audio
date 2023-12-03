import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardSideNav({ isProVersion }) {
	const style = {
		side_nav: {
			flexBasis: '150px',
		},
	};
	return (
		<div id='ttaTtaLayoutSidenav_nav' style={style.side_nav}>
			<nav
				className='tta-sidenav accordion tta-sidenav-dark text-white'
				id='sidenavAccordion'>
				<div className='tta-sidenav-menu'>
					<div className='nav'>
						{/* Settings menu */}
						<Link className='nav-link' to={'/'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-wrench'></i>
							</div>
							Settings
						</Link>
						<Link className='nav-link' to={'/recording'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-record-vinyl'></i>
							</div>
							Recording
						</Link>
						<Link className='nav-link' to={'/listening'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-file-audio'></i>
							</div>
							Listening
						</Link>
						<Link className='nav-link' to={'/customize'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-edit'></i>
							</div>
							Customization
						</Link>

						<Link className='nav-link' to={'/faq'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-book'></i>
							</div>
							FAQ
						</Link>
						<Link className='nav-link' to={'/integrations'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-edit'></i>
							</div>
							{isProVersion ? "Integrations" : "Integrations Pro"}
						</Link>
					</div>
				</div>
			</nav>
		</div>
	);
}
