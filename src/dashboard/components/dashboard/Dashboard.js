import React, { useEffect, useMemo, useState, } from 'react';
import {
	BrowserRouter as Router,
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
import Analitics from './analitics/Analitics.js';

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
								<Route path='/faq' element={<Docs />} />
								<Route path='/analitics' element={<Analitics />} />
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
