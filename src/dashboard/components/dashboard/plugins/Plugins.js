import { useEffect } from "react";

export default function Plugins() {
  useEffect(function () {
    var adminUrl =
      window.tta_obj && window.tta_obj.admin_url
        ? window.tta_obj.admin_url
        : "/wp-admin/";
    window.location.href = adminUrl + "admin.php?page=atlasvoice-other-plugins";
  }, []);

  return null;
}
