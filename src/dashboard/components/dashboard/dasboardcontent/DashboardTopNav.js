import React from "react";
import { Link } from "react-router-dom";

export default function DashboardTopNav() {
  return (
    <nav
      className="navbar navbar-expand"
      style={{
        background: "linear-gradient(135deg, #1a4d4d 0%, #2d6a6a 100%)",
        padding: "1rem 1.5rem",
        marginTop: "0.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      {/* LEFT SIDE LOGO + VERSION */}
      <Link
        className="navbar-brand d-flex align-items-center"
        to="/"
        style={{ minWidth: "200px" }}
      >
        <div
          style={{
            background: "#9EF01A",
            borderRadius: "8px",
            padding: "8px 10px",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className="fas fa-file-audio"
            style={{ fontSize: "24px", color: "#1a4d4d" }}
          ></i>
        </div>
        <div>
          <div
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "600",
              lineHeight: "1.2",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {tta_obj.plugin_name}
            {ttsObj.is_pro_active && (
              <span
                style={{
                  background: "#9EF01A",
                  color: "#1a4d4d",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  textTransform: "uppercase",
                }}
              >
                PRO
              </span>
            )}
          </div>
          <small style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
            v {ttsObj.VERSION}
          </small>
        </div>
      </Link>

      {/* RIGHT SIDE BUTTONS */}
      <div className="ms-auto d-flex align-items-center gap-2">
        {/* What's New */}
        <a
          href="https://atlasaidev.com/"
          target="_blank"
          className="btn d-flex align-items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          <span style={{ fontSize: "18px" }}>🎉</span>
          What's New
        </a>

        {/* Upgrade to Pro */}
        {!ttsObj.is_pro_active && (
          <a
            href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
            target="_blank"
            className="btn d-flex align-items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            <span style={{ fontSize: "18px" }}>💎</span>
            Upgrade to Pro
          </a>
        )}

        {/* Support */}
        <a
          href="http://atlasaidev.com/contact-us/"
          target="_blank"
          className="btn d-flex align-items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          <span style={{ fontSize: "18px" }}>📞</span>
          Support
        </a>
      </div>
    </nav>
  );
}
