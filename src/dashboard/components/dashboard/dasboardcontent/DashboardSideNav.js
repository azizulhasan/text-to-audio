import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardSideNav() {
	const style = {
		side_nav: {
			flexBasis: '150px',
		},
	};

	console.log(1)

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

						<Link className='nav-link' to={'/docs'}>
							<div className='sb-nav-link-icon'>
								<i className='fas fa-book'></i>
							</div>
							Docs
						</Link>
						{
							wp.hooks.addFilter('add_menu_to_text_to_audio', 'text-to-audio', function () {
								console.log('dashboard')


								return <Link className='nav-link' to={'/docs'}>
									<div className='sb-nav-link-icon'>
										<i className='fas fa-book'></i>
									</div>
									license66666666666
								</Link>;
							}, 10)
						}

						{
							wp.hooks.applyFilters('add_menu_to_text_to_audio', <Link className='nav-link' to={'/docs'}>
								<div className='sb-nav-link-icon'>
									<i className='fas fa-book'></i>
								</div>
								license
							</Link>)
						}
					</div>
				</div>
			</nav>
		</div>
	);
}
