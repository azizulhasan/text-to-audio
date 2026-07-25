import React from "react";
import { NavLink } from "react-router-dom";
import { pricingPageUrl } from "../../../proUrl";

import "./DashboardSideNav.css"; // Make sure to import the CSS

export default function DashboardSideNav({ isProVersion }) {
  const style = {
    side_nav: {
      flexBasis: "150px",
      position: "sticky",
      top: "80px",
      height: "calc(100vh - 80px)",
    },
  };

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div id="ttaTtaLayoutSidenav_nav" style={style.side_nav}>
      <nav
        className="tta-sidenav accordion tta-sidenav-dark text-white"
        id="sidenavAccordion"
      >
        <div className="tta-sidenav-menu">
          <div className="nav">
            {/* Settings menu */}
            <NavLink className={getNavLinkClass} to={"/"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-admin-generic"></span>
              </div>
              Settings
            </NavLink>
            <NavLink className={getNavLinkClass} to={"/integrations"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-admin-links"></span>
              </div>
              Integrations
            </NavLink>
            <NavLink className={getNavLinkClass} to={"/customize"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-art"></span>
              </div>
              Customization
            </NavLink>
            {/* <NavLink className={getNavLinkClass} to={'/recording'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-microphone"></span>
							</div>
							Recording
						</NavLink> */}
            <NavLink className={getNavLinkClass} to={"/listening"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-controls-volumeon"></span>
              </div>
              Listening
            </NavLink>
            {/* TTS-256: read-along word/sentence highlighting settings. */}
            <NavLink className={getNavLinkClass} to={"/highlight"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-editor-textcolor"></span>
              </div>
              Highlight
            </NavLink>
            <NavLink className={getNavLinkClass} to={"/analytics"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-chart-bar"></span>
              </div>
              Analytics
            </NavLink>
            <NavLink className={getNavLinkClass} to={"/compatibility"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-admin-plugins"></span>
              </div>
              Compatibility
            </NavLink>
            <NavLink className={getNavLinkClass} to={"/aliases"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-text"></span>
              </div>
              Aliases
            </NavLink>
            {/* TTS-239: Maintenance tab — Pro-only orphan temp-file cleanup. */}
            {isProVersion && (
              <NavLink className={getNavLinkClass} to={"/maintenance"}>
                <div className="sb-nav-link-icon">
                  <span className="dashicons dashicons-admin-tools"></span>
                </div>
                Maintenance
              </NavLink>
            )}
            <NavLink className={getNavLinkClass} to={"/faq"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-media-document"></span>
              </div>
              Docs
            </NavLink>
            {/* TTS-264: free-only Pricing link, just above "Our Plugins". Points
                to the standalone Pricing admin page (not a router route), so it's
                a plain anchor rather than a NavLink. */}
            {!isProVersion && (
              <a className="nav-link" href={pricingPageUrl("sidenav")}>
                <div className="sb-nav-link-icon">
                  <span className="dashicons dashicons-money-alt"></span>
                </div>
                Pricing
              </a>
            )}
            <NavLink className={getNavLinkClass} to={"/plugins"}>
              <div className="sb-nav-link-icon">
                <span className="dashicons dashicons-screenoptions"></span>
              </div>
              Our Plugins
            </NavLink>
            {/* <NavLink className={getNavLinkClass} to={'/analitics'}>
							<div className='sb-nav-link-icon'>
								<span className="dashicons dashicons-chart-bar"></span>
							</div>
							Analytics Pro
						</NavLink> */}
          </div>
        </div>
      </nav>
    </div>
  );
}
