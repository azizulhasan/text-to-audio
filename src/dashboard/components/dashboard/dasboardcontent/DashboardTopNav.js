import React from "react";
import { Link } from "react-router-dom";
export default function DashboardTopNav() {

  const style = {
    head: {
      width: "150px"
    }
  }
  return (
    <nav className="sb-topnav navbar navbar-expand topnav_bg">
      {/* <!-- Navbar Brand--> */}
      <Link className="navbar-brand ps-3" style={style.head} to="/">
      Text To Audio
      </Link>
      {/* <!-- Sidebar Toggle--> */}
      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
        id="sidebarToggle"
        href="#!"
      >
        <i className="fas fa-bars text-white"></i>
      </button>
    </nav>
  );
}
