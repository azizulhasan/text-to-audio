import React from "react";
import { Link } from "react-router-dom";
export default function DashboardTopNav() {

  const style = {
    head: {
      width: "150px",
      fontSize: '16px',
    }
  }
  return (
    <nav className="sb-topnav navbar navbar-expand topnav_bg">
      {/* <!-- Navbar Brand--> */}
      <Link className="navbar-brand ps-3" style={style.head} to="/">
        {tta_obj.plugin_name}<br></br>
        <small>Version: {ttsObj.VERSION} </small>
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
      {
        !ttsObj.is_pro_active && <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/" target="_blank">
          Buy Now
        </a>
      }
      <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="http://atlasaidev.com/contact-us/" target="_blank">
        Support
      </a>

      {
        !ttsObj.is_pro_active && <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://atlasaidev.com/text-to-speech-pro/demo/" target="_blank">
          Pro Version Demo
        </a>
      }
      <a className="navbar-nav ms-auto  me-2 text-decoration-none   order-2 order-lg-1" href="https://atlasaidev.com/docs/" target="_blank">
        <span className="dashicons dashicons-media-document"></span> Documentation
      </a>
      <div className='navbar-nav ms-auto   order-2 order-lg-1'>
          <a className="me-1 text-decoration-none" href="https://www.youtube.com/@AtlasAiDev" target="_blank">
              <span className="dashicons dashicons-youtube text-danger"></span>
          </a>
          <a className="me-1 text-decoration-none" href="https://www.facebook.com/AtlasAiDev/" target="_blank">
              <span className="dashicons dashicons-facebook-alt text-primary"></span>
          </a>
          <a className="me-1 text-decoration-none" href="https://x.com/atlasaidev" target="_blank">
              <span className="dashicons dashicons-twitter text-primary"></span>
          </a>
      </div>
    </nav>
  );
}
