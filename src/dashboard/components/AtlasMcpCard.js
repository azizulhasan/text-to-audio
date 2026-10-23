import React from "react";
import { __ } from "@wordpress/i18n";

/**
 * TTS-352: promotes our AtlasMCP plugin in the dashboard sidebar (below the
 * beta card): AI assistants manage posts, WooCommerce, media and SEO over MCP.
 *
 * Data comes from TTA_Helper::get_atlasmcp_promo() (tta_obj.atlasmcp): hidden
 * once AtlasMCP is active; the button only opens WordPress's own plugin screen
 * (wp.org Guidelines 8 and 11) and is left out for users who can't install.
 */
export default function AtlasMcpCard() {
  const promo = window?.tta_obj?.atlasmcp;
  if (!promo || promo.status === "active") {
    return null;
  }

  const label = promo.status === "installed" ? __("Activate AtlasMCP", "text-to-audio") : __("Install AtlasMCP", "text-to-audio");

  return (
    <div className="tta-promo-card tta-mcp-card">
      <span className="tta-promo-tag tta-mcp-tag">{__("Free plugin · AtlasMCP", "text-to-audio")}</span>
      <h5 className="tta-promo-title">{__("Run your site from Claude, ChatGPT and more", "text-to-audio")}</h5>
      <p className="tta-promo-text">{__("Posts, WooCommerce, media and SEO, by chat.", "text-to-audio")}</p>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {promo.action_url && (
          <a className="btn btn-sm tta-promo-btn tta-mcp-btn" href={promo.action_url}>
            {label}
          </a>
        )}
        <a className="tta-promo-link tta-mcp-link" href={promo.wporg_url} target="_blank" rel="noopener noreferrer">
          {__("Learn more", "text-to-audio")}
        </a>
      </div>
    </div>
  );
}
