import React from "react";
import { Link } from "react-router-dom";
import { getUserName } from "../../context/utilities";

export default function DashboardSideNav() {
  return (
    <div id="layoutSidenav_nav">
      <nav
        className="sb-sidenav accordion sb-sidenav-dark"
        id="sidenavAccordion"
      >
        <div className="sb-sidenav-menu">
          <div className="nav">
            <Link className="nav-link" to={wp_access.url+ "/dashboard/mail"} >
              <div className="sb-nav-link-icon">
                <i className="fas fa-envelope"></i>
              </div>
              Mail
            </Link>
            <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#collapsePages" aria-expanded="false" aria-controls="collapsePages">
              <div className="sb-nav-link-icon"><i className="fas fa-book-open"></i></div>
                Portfolio
              <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
            </a>
            {/* Settings menu */}
            <Link className="nav-link" to= {wp_access.url+ "/dashboard/settings"}>
              <div className="sb-nav-link-icon">
                <i className="fas fa-wrench"></i>
              </div>
              Settings
            </Link>
          </div>
        </div>
        <div className="sb-sidenav-footer">
          <div className="small">Logged in as:</div>
          {getUserName()}
        </div>
      </nav>
    </div>
  );
}
