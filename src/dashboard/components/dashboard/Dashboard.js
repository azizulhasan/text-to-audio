import React, { lazy, Suspense, useEffect, useState, } from 'react';
import {
	HashRouter,
	Routes,
	Route,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';


/**
 * Scripts
 */
import 'react-toastify/dist/ReactToastify.css';

import './assets/js/scripts.js';
import {  getComponentName } from '../context/utilities';

/**
 * Dashboard Components (always loaded)
 */
import DashboardTopNav from './dasboardcontent/DashboardTopNav';
import DashboardSideNav from './dasboardcontent/DashboardSideNav';
import DashboardLoader from './DashboardLoader';

/**
 * Lazy-loaded tab components — each tab is loaded on-demand
 * when the user navigates to it, reducing the initial bundle size.
 */
const Settings = lazy(() => import(/* webpackChunkName: "tab-settings" */ './settings/Settings'));
const Listening = lazy(() => import(/* webpackChunkName: "tab-listening" */ './listening/Listening'));
const Customize = lazy(() => import(/* webpackChunkName: "tab-customize" */ './customize/Customize'));
const Docs = lazy(() => import(/* webpackChunkName: "tab-docs" */ './docs/Docs'));
const Analitics = lazy(() => import(/* webpackChunkName: "tab-analytics" */ './analitics/Analitics.js'));
const Integrations = lazy(() => import(/* webpackChunkName: "tab-integrations" */ './integrations/Integrations.js'));
const Compatibility = lazy(() => import(/* webpackChunkName: "tab-compatibility" */ './compatibility/Compatibility.js'));
const Aliases = lazy(() => import(/* webpackChunkName: "tab-aliases" */ './aliases/Aliases.js'));
const Plugins = lazy(() => import(/* webpackChunkName: "tab-plugins" */ './plugins/Plugins.js'));
// TTS-239: Maintenance tab — orphan temp-file cleanup (Pro-only).
const Maintenance = lazy(() => import(/* webpackChunkName: "tab-maintenance" */ './maintenance/Maintenance.js'));

function Dashboard() {
	const [componentName, setComponentName] = useState(getComponentName());
	useEffect(() => {
		new MutationObserver(() => {
			setComponentName(getComponentName());
		}).observe(document, { subtree: true, childList: true });
	}, [componentName]);
	const [isProVersion, setIsProVersion] = useState(false)

	useEffect(() => {
		setIsProVersion(ttsObj.is_pro_active)
	}, [])

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
							<Suspense fallback={<DashboardLoader />}>
								<Routes>
									<Route
										path='/'
										element={<Settings />}
									/>
									<Route path='/integrations' element={<Integrations />} />
									<Route
										path={'/customize'}
										element={<Customize />}
									/>
									<Route
										path={'/listening'}
										element={<Listening />}
									/>
									{/* <Route
										path={'/recording'}
										element={<Recording />}
									/> */}
									<Route path='/analytics' element={<Analitics />} />
									<Route path='/compatibility' element={<Compatibility />} />
									<Route path='/aliases' element={<Aliases />} />
									{/* TTS-239: Maintenance tab is Pro-only; route is registered only when Pro is active. */}
									{isProVersion && (
										<Route path='/maintenance' element={<Maintenance />} />
									)}
									<Route path='/faq' element={<Docs />} />
									<Route path='/plugins' element={<Plugins />} />

								</Routes>
							</Suspense>
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
