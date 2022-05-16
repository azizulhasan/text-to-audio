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
        className="sb-sidenav accordion sb-sidenav-dark text-white"
        id="sidenavAccordion"
      >
        <div className="sb-sidenav-menu">
          <div className="nav">
            <Link className="nav-link" to={"/"} >
              <div className="sb-nav-link-icon">
                {/* <i className="fas fa-envelope"></i> */}
                <i className="fas fa-record-vinyl"></i>
              </div>
              Recording
            </Link>
            <Link className="nav-link" to={"/listening"} >
              <div className="sb-nav-link-icon">
              <i className="fas fa-file-audio"></i>
              </div>
              Listening
            </Link>
            <Link className="nav-link" to={"/customize"} >
              <div className="sb-nav-link-icon">
              <i className="fas fa-edit"></i>
              </div>
              Customization
            </Link>
            {/* Settings menu */}
            <Link className="nav-link" to= { "/settings"}>
              <div className="sb-nav-link-icon">
                <i className="fas fa-wrench"></i>
              </div>
              Settings
            </Link>
            <Link className="nav-link" to= { "/docs"}>
              <div className="sb-nav-link-icon">
              <i className="fas fa-book"></i>
              </div>
              Docs
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
