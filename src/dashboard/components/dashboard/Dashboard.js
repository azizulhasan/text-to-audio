import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, HashRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
/**
 * Scripts
 */
import "./assets/css/styles.css";
import "./assets/js/scripts.js";
import {
  addScripts,
  getComponentName,
  authenTicateUser,
} from "../context/utilities";

/**
 * Dashboard Components
 */
import DashboardTopNav from "./dasboardcontent/DashboardTopNav";
import DashboardSideNav from "./dasboardcontent/DashboardSideNav";
import Settings from "./settings/Settings";
import Recording from "./recording/Recording";
import Listening from "./listening/Listening";
import Customize from "./customize/Customize";



export default function Dashboard() {
  // authenTicateUser();
  const [componentName, setComponentName] = useState(getComponentName());
  useEffect(() => {
    new MutationObserver(() => {
      setComponentName(getComponentName());
    }).observe(document, { subtree: true, childList: true });
  }, [componentName]);

  addScripts([
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js",
  ]);

  

  return (
    <HashRouter hashType="noslash">
      <ToastContainer
        position="top-right"
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
      <div id="layoutSidenav">
        <DashboardSideNav />
        <div id="layoutSidenav_content">
          <main>
            <div className="container-fluid">
              <Routes>
                <Route path="/" element={<Recording />} />
                <Route path={ "/listening"} element={<Listening/>} />
                <Route path={ "/customize"} element={<Customize/>} />
                <Route path={"/settings"} element={<Settings />} />
              </Routes>
            </div>
          </main>
          <footer className="py-4 mt-auto footer_bg">
            <div className="container-fluid px-4">
              <div className="d-flex align-items-center justify-content-between small">
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
              </div>
            </div>
          </footer>
        </div>
      </div>
    </HashRouter>
  );
}
