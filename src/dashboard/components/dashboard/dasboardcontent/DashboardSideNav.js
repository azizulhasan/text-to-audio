import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardSideNav() {
	const style = {
		side_nav: {
			flexBasis: '150px',
		},
	};

	const [hasPro, setHasPro] = useState(false)

	useEffect(() => {
		let Pro = wp.hooks.applyFilters('tta_has_pro', false);
		console.log(Pro)
		setHasPro(Pro)
	}, [])



	return (
		<div id='ttaTtaLayoutSidenav_nav' style={style.side_nav}>
			{
				console.log('sidenav_dom')
			}
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
							hasPro ? <Link className='nav-link' to={'/customize'}>
								<div className='sb-nav-link-icon'>
									<i className='fas fa-edit'></i>
								</div>
								License4444
							</Link> : <>
								{
									console.log('false')
								}
							</>
						}
					</div>
					{
						wp.hooks.doAction('add_menu_to_text_test')
					}
				</div>
			</nav>
		</div>
	);
}
