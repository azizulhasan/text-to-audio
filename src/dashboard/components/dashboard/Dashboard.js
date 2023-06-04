import React, { memo, useEffect, useMemo, useState, } from 'react';
import {
	BrowserRouter as Router,
	HashRouter,
	Routes,
	Route,

} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';


import 'react-toastify/dist/ReactToastify.css';
/**
 * Scripts
 */
import './assets/css/styles.css';
import './assets/js/scripts.js';
import { addScripts, getComponentName, isPro } from '../context/utilities';

/**
 * Dashboard Components
 */
import DashboardTopNav from './dasboardcontent/DashboardTopNav';
import DashboardSideNav from './dasboardcontent/DashboardSideNav';
import Settings from './settings/Settings';
import Recording from './recording/Recording';
import Listening from './listening/Listening';
import Customize from './customize/Customize';
import Docs from './docs/Docs';
import License from './license/Lincense';

function Dashboard() {
	// authenTicateUser();
	const [componentName, setComponentName] = useState(getComponentName());
	useEffect(() => {
		new MutationObserver(() => {
			setComponentName(getComponentName());
		}).observe(document, { subtree: true, childList: true });
	}, [componentName]);
	const [isProVersion, setIsProVersion] = useState(false)

	useEffect(() => {
		let pro = wp.hooks.applyFilters('tts_is_pro_active', false);
		let licenseCheck = wp.hooks.applyFilters('tts_is_pro_license_active', false);
		setIsProVersion(isPro(pro, licenseCheck))
	}, [])

	addScripts([
		'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js',
	]);
	return (
		<HashRouter hashType='noslash'>
			<ToastContainer
				position='top-right'
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
			/>
			<DashboardTopNav />
			<div id='ttaLayoutSidenav'>
				<DashboardSideNav isProVersion={isProVersion} />
				<div id='ttaLayoutSidenav_content'>
					<main>
						<div className='container-fluid'>
							<Routes>
								<Route
									path='/'
									element={useMemo(() => (
										<Settings />
									))}
								/>
								<Route
									path={'/listening'}
									element={useMemo(() => (
										<Listening />
									))}
								/>
								<Route
									path={'/customize'}
									element={<Customize />}
								/>
								<Route
									path={'/recording'}
									element={<Recording />}
								/>
								<Route path='/docs' element={<Docs />} />
								{
									isProVersion && <Route path='/license' element={<License />} />
								}
							</Routes>

						</div>
					</main>
					<footer className='py-4 mt-auto footer_bg'>
						<div className='container-fluid px-4'>
							{/* <div className="d-flex align-items-center justify-content-between small">
                <div className="text-muted">
                  Copyright &copy;{" "}
                  <a
                    rel="noopener"
                    href="http://azizulhasan.com/"
                    target="_blank"
                  >
                    Azizul Hasan
                  </a>
                </div>
              </div> */}
						</div>
					</footer>
				</div>
			</div>
		</HashRouter>
	);
}
export default Dashboard;
