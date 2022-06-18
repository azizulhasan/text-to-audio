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

      {/* me-3 me-lg-4 */}
      <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://wordpress.org/support/plugin/text-to-audio/#new-topic-0" target="_blank">
      Support
      </a>
      <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://wordpress.org/support/plugin/text-to-audio/reviews/#new-post" target="_blank">
      Give A Review
      </a>
      <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://wp-speech.azizulhasan.com/contact/" target="_blank">
      Rquest a feature
      </a>
    </nav>
  );
}
