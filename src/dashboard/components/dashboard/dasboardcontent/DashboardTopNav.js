import React from "react";
import { Link } from "react-router-dom";
import { logout } from "../../context/utilities";

export default function DashboardTopNav() {
  return (
    <nav className="sb-topnav navbar navbar-expand topnav_bg">
      {/* <!-- Navbar Brand--> */}
      <Link className="navbar-brand ps-3 text-dark" to="/dashboard">
        {process.env.REACT_APP_WEBSITE_NAME}
      </Link>
      {/* <!-- Sidebar Toggle--> */}
      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
        id="sidebarToggle"
        href="#!"
      >
        <i className="fas fa-bars text-dark"></i>
      </button>
      {/* <!-- Navbar Search--> */}
      <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
        <div className="input-group ">
          <input
            className="form-control text-dark"
            type="text"
            placeholder="Search for..."
            aria-label="Search for..."
            aria-describedby="btnNavbarSearch"
          />
          <button className="btn btn-dark " id="btnNavbarSearch" type="button">
            <i className="fas fa-search text-light"></i>
          </button>
        </div>
      </form>
      {/* <!-- Navbar--> */}
      <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle text-dark"
            id="navbarDropdown"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fas fa-user fa-fw"></i>
          </a>
          <ul
            className="dropdown-menu dropdown-menu-end"
            aria-labelledby="navbarDropdown"
          >
            <li>
              <a className="dropdown-item" href="#!">
                Settings
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#!">
                Activity Log
              </a>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" onClick={(e)=> logout()} href="#!">
                Logout
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
