import React from "react";
import { Link } from "react-router-dom";

export default function DashboardSideNav() {


  const style = {
    side_nav: {
      flexBasis: "150px"
    }
  }
  return (
    <div id="layoutSidenav_nav" style={style.side_nav}>
      <nav
        className="sb-sidenav accordion sb-sidenav-dark"
        id="sidenavAccordion"
      >
        <div className="sb-sidenav-menu">
          <div className="nav">
            <Link className="nav-link" to={"/dashboard/mail"} >
              <div className="sb-nav-link-icon">
                <i className="fas fa-envelope"></i>
              </div>
              Mail
            </Link>
            {/* Settings menu */}
            <Link className="nav-link" to= { "/dashboard/settings"}>
              <div className="sb-nav-link-icon">
                <i className="fas fa-wrench"></i>
              </div>
              Settings
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
