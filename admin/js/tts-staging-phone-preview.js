import qrcode from "qrcode-generator";

/**
 * TTS-351: "Test on your phone" in the front-end staging note (admins only).
 *
 * Asks tta/v1/preview-link for a private 24-hour link to the post being viewed
 * and shows it as a QR code, so the owner can check the staging player on a
 * phone where they are not logged in. Loaded only when the note is printed.
 */
const { __ } = (typeof wp !== "undefined" && wp.i18n) ? wp.i18n : { __: (s) => s };

function closeDialog() {
    const el = document.getElementById("atlasvoice-phone-preview");
    if (el) {
        el.remove();
    }
    document.removeEventListener("keydown", onKey);
}

function onKey(e) {
    if (e.key === "Escape") {
        closeDialog();
    }
}

function openDialog(content) {
    closeDialog();
    const ovl = document.createElement("div");
    ovl.id = "atlasvoice-phone-preview";
    ovl.setAttribute("role", "dialog");
    ovl.setAttribute("aria-modal", "true");
    ovl.setAttribute("aria-label", __("Test the player on your phone", "text-to-audio"));
    ovl.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;";
    const box = document.createElement("div");
    box.style.cssText = "background:#fff;color:#1d2327;border-radius:12px;max-width:360px;width:100%;padding:18px;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.25);text-align:center;";
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;text-align:left"><strong style="font-size:16px"></strong><button type="button" data-close style="border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:#50575e" aria-label=""></button></div><div data-body></div>';
    box.querySelector("strong").textContent = __("Test on your phone", "text-to-audio");
    const x = box.querySelector("[data-close]");
    x.textContent = "×";
    x.setAttribute("aria-label", __("Close", "text-to-audio"));
    box.querySelector("[data-body]").appendChild(content);
    ovl.appendChild(box);
    ovl.addEventListener("click", (e) => {
        if (e.target === ovl || e.target.hasAttribute("data-close")) {
            closeDialog();
        }
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ovl);
}

function text(str, style) {
    const p = document.createElement("p");
    p.style.cssText = style || "margin:0 0 8px;";
    p.textContent = str;
    return p;
}

async function showPreview(postId) {
    const loading = text(__("Creating your private link…", "text-to-audio"));
    openDialog(loading);

    const cfg = window.ttsPhonePreview || {};
    let res = null;
    try {
        const r = await fetch(cfg.endpoint, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-WP-Nonce": cfg.nonce },
            body: JSON.stringify({ post_id: postId }),
        });
        res = await r.json();
    } catch (e) {
        res = null;
    }

    const wrap = document.createElement("div");
    if (!res || !res.status || !res.url) {
        wrap.appendChild(text((res && res.message) || __("The preview link could not be created. Please try again.", "text-to-audio"), "margin:0;color:#b32d2e;"));
        openDialog(wrap);
        return;
    }

    const qr = qrcode(0, "M");
    qr.addData(res.url);
    qr.make();
    const img = document.createElement("img");
    img.src = qr.createDataURL(5, 8);
    img.width = 200;
    img.height = 200;
    img.alt = __("QR code for the private preview link", "text-to-audio");
    img.style.cssText = "display:block;margin:0 auto 10px;";
    wrap.appendChild(img);
    wrap.appendChild(text(__("Scan with your phone's camera. This post opens with the player, even though you're not logged in there.", "text-to-audio")));
    wrap.appendChild(text(__("The link is private and works for 24 hours. Visitors without it still see nothing until you go live.", "text-to-audio"), "margin:0 0 12px;font-size:12px;color:#646970;"));

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = __("Copy link", "text-to-audio");
    copy.style.cssText = "border:1px solid #8c8f94;background:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;font:inherit;";
    copy.addEventListener("click", () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(res.url).then(() => {
                copy.textContent = __("Link copied", "text-to-audio");
            });
        }
    });
    wrap.appendChild(copy);
    openDialog(wrap);
}

document.addEventListener("click", (e) => {
    const link = e.target.closest ? e.target.closest(".atlasvoice-staging-note__phone") : null;
    if (!link) {
        return;
    }
    e.preventDefault();
    showPreview(parseInt(link.getAttribute("data-post-id"), 10) || 0);
});
