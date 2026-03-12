/**
 * Lightweight SVG Icon component.
 * Replaces Font Awesome 1.2 MB bundle with ~3 KB of inline SVGs.
 *
 * Usage:
 *   <Icon name="youtube" />
 *   <Icon name="spinner" spin />
 *   <Icon name="lock" className="me-2" />
 *
 * @since 2.3.0
 */
import React from "react";

const icons = {
	"question-circle": (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	),
	lock: (
		<svg viewBox="0 0 448 512" fill="currentColor">
			<path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z" />
		</svg>
	),
	spinner: (
		<svg viewBox="0 0 512 512" fill="currentColor">
			<path d="M304 48c0 26.5-21.5 48-48 48s-48-21.5-48-48 21.5-48 48-48 48 21.5 48 48zm-48 368c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zm208-208c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zM96 256c0-26.5-21.5-48-48-48S0 229.5 0 256s21.5 48 48 48 48-21.5 48-48zm12.3 145.1c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zM403.7 65c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zm-55.4 336c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48zM108.3 65c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48z" />
		</svg>
	),
	"file-audio": (
		<svg viewBox="0 0 384 512" fill="currentColor">
			<path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm-64 268c0 10.7-12.9 16-20.5 8.5L104 376H76c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h28l35.5-36.5c7.6-7.6 20.5-2.2 20.5 8.5v136zm33.2-47.6c9.1-9.3 9.1-24.1 0-33.4-22.1-22.8 12.2-56.2 34.4-33.5 27.2 27.9 27.2 72.4 0 100.4-22.3 22.8-56.5-10.4-34.4-33.5zm86-117.1c17.6 18.1 17.6 46.8 0 64.9-22.1 22.8 12.2 56.3 34.4 33.5 44.4-45.5 44.4-118.4 0-163.9-22.3-22.8-56.6 10.3-34.4 33.5zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z" />
		</svg>
	),
	"play-circle": (
		<svg viewBox="0 0 512 512" fill="currentColor">
			<path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 33.8 0 42z" />
		</svg>
	),
	copy: (
		<svg viewBox="0 0 448 512" fill="currentColor">
			<path d="M320 448v40c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V120c0-13.3 10.7-24 24-24h72v296c0 30.9 25.1 56 56 56h168zm0-344V0H152c-13.3 0-24 10.7-24 24v368c0 13.3 10.7 24 24 24h272c13.3 0 24-10.7 24-24V128H344c-13.2 0-24-10.8-24-24zm121-31L375 7A24 24 0 0 0 358.1 0H352v96h96v-6.1a24 24 0 0 0-7-17z" />
		</svg>
	),
	"info-circle": (
		<svg viewBox="0 0 512 512" fill="currentColor">
			<path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 110c23.2 0 42 18.8 42 42s-18.8 42-42 42-42-18.8-42-42 18.8-42 42-42zm56 254c0 6.6-5.4 12-12 12h-88c-6.6 0-12-5.4-12-12v-24c0-6.6 5.4-12 12-12h12v-64h-12c-6.6 0-12-5.4-12-12v-24c0-6.6 5.4-12 12-12h64c6.6 0 12 5.4 12 12v100h12c6.6 0 12 5.4 12 12v24z" />
		</svg>
	),
	circle: (
		<svg viewBox="0 0 512 512" fill="currentColor">
			<path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z" />
		</svg>
	),
	youtube: (
		<svg viewBox="0 0 576 512" fill="currentColor">
			<path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
		</svg>
	),
	"check-circle": (
		<svg viewBox="0 0 512 512" fill="currentColor">
			<path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" />
		</svg>
	),
	times: (
		<svg viewBox="0 0 352 512" fill="currentColor">
			<path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
		</svg>
	),
	eye: (
		<svg viewBox="0 0 576 512" fill="currentColor">
			<path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z" />
		</svg>
	),
};

/* CSS for spin animation is injected once */
const SPIN_STYLE_ID = "tta-icon-spin-style";
function ensureSpinStyle() {
	if (typeof document === "undefined") return;
	if (document.getElementById(SPIN_STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = SPIN_STYLE_ID;
	style.textContent = `@keyframes tta-icon-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.tta-icon-spin{animation:tta-icon-spin 1s linear infinite}`;
	document.head.appendChild(style);
}

/**
 * @param {Object}  props
 * @param {string}  props.name      - Icon name (e.g. "youtube", "lock", "spinner")
 * @param {boolean} [props.spin]    - Enable spin animation (used with "spinner")
 * @param {string}  [props.className] - Additional CSS classes
 * @param {Object}  [props.style]   - Additional inline styles
 */
export default function Icon({ name, spin = false, className = "", style = {}, ...rest }) {
	const svg = icons[name];
	if (!svg) {
		if (process.env.NODE_ENV === "development") {
			console.warn(`[Icon] Unknown icon: "${name}"`);
		}
		return null;
	}

	if (spin) {
		ensureSpinStyle();
	}

	const classes = [
		"tta-icon",
		spin ? "tta-icon-spin" : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<span
			className={classes}
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: "1em",
				height: "1em",
				verticalAlign: "-0.125em",
				...style,
			}}
			role="img"
			aria-hidden="true"
			{...rest}
		>
			{React.cloneElement(svg, {
				width: "1em",
				height: "1em",
				style: { width: "1em", height: "1em" },
			})}
		</span>
	);
}
