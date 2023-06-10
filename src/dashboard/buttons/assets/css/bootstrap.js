export const bootstrapCSS = {
    ":root": {
        "--bs-blue": "#0d6efd",
        "--bs-indigo": "#6610f2",
        "--bs-purple": "#6f42c1",
        "--bs-pink": "#d63384",
        "--bs-red": "#dc3545",
        "--bs-orange": "#fd7e14",
        "--bs-yellow": "#ffc107",
        "--bs-green": "#198754",
        "--bs-teal": "#20c997",
        "--bs-cyan": "#0dcaf0",
        "--bs-white": "#fff",
        "--bs-gray": "#6c757d",
        "--bs-gray-dark": "#343a40",
        "--bs-gray-100": "#f8f9fa",
        "--bs-gray-200": "#e9ecef",
        "--bs-gray-300": "#dee2e6",
        "--bs-gray-400": "#ced4da",
        "--bs-gray-500": "#adb5bd",
        "--bs-gray-600": "#6c757d",
        "--bs-gray-700": "#495057",
        "--bs-gray-800": "#343a40",
        "--bs-gray-900": "#212529",
        "--bs-primary": "#0d6efd",
        "--bs-secondary": "#6c757d",
        "--bs-success": "#198754",
        "--bs-info": "#0dcaf0",
        "--bs-warning": "#ffc107",
        "--bs-danger": "#dc3545",
        "--bs-light": "#f8f9fa",
        "--bs-dark": "#212529",
        "--bs-primary-rgb": "13, 110, 253",
        "--bs-secondary-rgb": "108, 117, 125",
        "--bs-success-rgb": "25, 135, 84",
        "--bs-info-rgb": "13, 202, 240",
        "--bs-warning-rgb": "255, 193, 7",
        "--bs-danger-rgb": "220, 53, 69",
        "--bs-light-rgb": "248, 249, 250",
        "--bs-dark-rgb": "33, 37, 41",
        "--bs-white-rgb": "255, 255, 255",
        "--bs-black-rgb": "0, 0, 0",
        "--bs-body-color-rgb": "33, 37, 41",
        "--bs-body-bg-rgb": "255, 255, 255",
        "--bs-font-sans-serif":
            "system-ui, -apple-system, 'Segoe UI', Roboto,\n\t\t'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif,\n\t\t'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',\n\t\t'Noto Color Emoji'",
        "--bs-font-monospace":
            "SFMono-Regular, Menlo, Monaco, Consolas,\n\t\t'Liberation Mono', 'Courier New', monospace",
        "--bs-gradient":
            "linear-gradient(\n\t\t180deg,\n\t\trgba(255, 255, 255, 0.15),\n\t\trgba(255, 255, 255, 0)\n\t)",
        "--bs-body-font-family": "var(--bs-font-sans-serif)",
        "--bs-body-font-size": "1rem",
        "--bs-body-font-weight": "400",
        "--bs-body-line-height": "1.5",
        "--bs-body-color": "#212529",
        "--bs-body-bg": "#fff"
    },
    "*,\n*::before,\n*::after": { boxSizing: "border-box" },
    "@media (prefers-reduced-motion: no-preference)": {
        ":root": { scrollBehavior: "smooth" }
    },
    body: {
        margin: "0",
        fontFamily: "var(--bs-body-font-family)",
        fontSize: "var(--bs-body-font-size)",
        fontWeight: "var(--bs-body-font-weight)",
        lineHeight: "var(--bs-body-line-height)",
        color: "var(--bs-body-color)",
        textAlign: "var(--bs-body-text-align)",
        backgroundColor: "var(--bs-body-bg)",
        WebkitTextSizeAdjust: "100%",
        WebkitTapHighlightColor: "rgba(0, 0, 0, 0)"
    },
    hr: {
        margin: "1rem 0",
        color: "inherit",
        backgroundColor: "currentColor",
        border: "0",
        opacity: 0.25
    },
    "hr:not([size])": { height: "1px" },
    "h6,\n.h6,\nh5,\n.h5,\nh4,\n.h4,\nh3,\n.h3,\nh2,\n.h2,\nh1,\n.h1": {
        marginTop: "0",
        marginBottom: "0.5rem",
        fontWeight: 500,
        lineHeight: 1.2
    },
    "h1,\n.h1": { fontSize: "calc(1.375rem + 1.5vw)" },
    "@media (min-width: 1200px)": [
        { "h1,\n\t.h1": { fontSize: "2.5rem" } },
        { "h2,\n\t.h2": { fontSize: "2rem" } },
        { "h3,\n\t.h3": { fontSize: "1.75rem" } },
        { "h4,\n\t.h4": { fontSize: "1.5rem" } },
        { legend: { fontSize: "1.5rem" } },
        { ".display-1": { fontSize: "5rem" } },
        { ".display-2": { fontSize: "4.5rem" } },
        { ".display-3": { fontSize: "4rem" } },
        { ".display-4": { fontSize: "3.5rem" } },
        { ".display-5": { fontSize: "3rem" } },
        { ".display-6": { fontSize: "2.5rem" } }
    ],
    "h2,\n.h2": { fontSize: "calc(1.325rem + 0.9vw)" },
    "h3,\n.h3": { fontSize: "calc(1.3rem + 0.6vw)" },
    "h4,\n.h4": { fontSize: "calc(1.275rem + 0.3vw)" },
    "h5,\n.h5": { fontSize: "1.25rem" },
    "h6,\n.h6": { fontSize: "1rem" },
    p: { marginTop: "0", marginBottom: "1rem" },
    "abbr[title],\nabbr[data-bs-original-title]": {
        WebkitTextDecoration: "underline dotted",
        textDecoration: "underline dotted",
        cursor: "help",
        WebkitTextDecorationSkipInk: "none",
        textDecorationSkipInk: "none"
    },
    address: { marginBottom: "1rem", fontStyle: "normal", lineHeight: "inherit" },
    "ol,\nul": { paddingLeft: "2rem" },
    "ol,\nul,\ndl": { marginTop: "0", marginBottom: "1rem" },
    "ol ol,\nul ul,\nol ul,\nul ol": { marginBottom: "0" },
    dt: { fontWeight: 700 },
    dd: { marginBottom: "0.5rem", marginLeft: "0" },
    blockquote: { margin: "0 0 1rem" },
    "b,\nstrong": { fontWeight: "bolder" },
    "small,\n.small": { fontSize: "0.875em" },
    "mark,\n.mark": { padding: "0.2em", backgroundColor: "#fcf8e3" },
    "sub,\nsup": {
        position: "relative",
        fontSize: "0.75em",
        lineHeight: 0,
        verticalAlign: "baseline"
    },
    sub: { bottom: "-0.25em" },
    sup: { top: "-0.5em" },
    a: { color: "#0d6efd", textDecoration: "underline" },
    "a:hover": { color: "#0a58ca" },
    "a:not([href]):not([class]),\na:not([href]):not([class]):hover": {
        color: "inherit",
        textDecoration: "none"
    },
    "pre,\ncode,\nkbd,\nsamp": {
        fontFamily: "var(--bs-font-monospace)",
        fontSize: "1em",
        direction: "ltr ",
        unicodeBidi: "bidi-override"
    },
    pre: {
        display: "block",
        marginTop: "0",
        marginBottom: "1rem",
        overflow: "auto",
        fontSize: "0.875em"
    },
    "pre code": { fontSize: "inherit", color: "inherit", wordBreak: "normal" },
    code: { fontSize: "0.875em", color: "#d63384", wordWrap: "break-word" },
    "a > code": { color: "inherit" },
    kbd: {
        padding: "0.2rem 0.4rem",
        fontSize: "0.875em",
        color: "#fff",
        backgroundColor: "#212529",
        borderRadius: "0.2rem"
    },
    "kbd kbd": { padding: "0", fontSize: "1em", fontWeight: 700 },
    figure: { margin: "0 0 1rem" },
    "img,\nsvg": { verticalAlign: "middle" },
    table: { captionSide: "bottom", borderCollapse: "collapse" },
    caption: {
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        color: "#6c757d",
        textAlign: "left"
    },
    th: { textAlign: ["inherit", "-webkit-match-parent"] },
    "thead,\ntbody,\ntfoot,\ntr,\ntd,\nth": {
        borderColor: "inherit",
        borderStyle: "solid",
        borderWidth: "0"
    },
    label: { display: "inline-block" },
    button: { borderRadius: "0" },
    "button:focus:not(:focus-visible)": { outline: "0" },
    "input,\nbutton,\nselect,\noptgroup,\ntextarea": {
        margin: "0",
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit"
    },
    "button,\nselect": { textTransform: "none" },
    "[role='button']": { cursor: "pointer" },
    select: { wordWrap: "normal" },
    "select:disabled": { opacity: 1 },
    "[list]::-webkit-calendar-picker-indicator": { display: "none" },
    "button,\n[type='button'],\n[type='reset'],\n[type='submit']": {
        WebkitAppearance: "button"
    },
    "button:not(:disabled),\n[type='button']:not(:disabled),\n[type='reset']:not(:disabled),\n[type='submit']:not(:disabled)": {
        cursor: "pointer"
    },
    "::-moz-focus-inner": { padding: "0", borderStyle: "none" },
    textarea: { resize: "vertical" },
    fieldset: { minWidth: "0", padding: "0", margin: "0", border: "0" },
    legend: {
        cssFloat: "left",
        width: "100%",
        padding: "0",
        marginBottom: "0.5rem",
        fontSize: "calc(1.275rem + 0.3vw)",
        lineHeight: "inherit"
    },
    "legend + *": { clear: "left" },
    "::-webkit-datetime-edit-fields-wrapper,\n::-webkit-datetime-edit-text,\n::-webkit-datetime-edit-minute,\n::-webkit-datetime-edit-hour-field,\n::-webkit-datetime-edit-day-field,\n::-webkit-datetime-edit-month-field,\n::-webkit-datetime-edit-year-field": {
        padding: "0"
    },
    "::-webkit-inner-spin-button": { height: "auto" },
    "[type='search']": { outlineOffset: "-2px", WebkitAppearance: "textfield" },
    "::-webkit-search-decoration": { WebkitAppearance: "none" },
    "::-webkit-color-swatch-wrapper": { padding: "0" },
    "::file-selector-button": { font: "inherit" },
    "::-webkit-file-upload-button": {
        font: "inherit",
        WebkitAppearance: "button"
    },
    output: { display: "inline-block" },
    iframe: { border: "0" },
    summary: { display: "list-item", cursor: "pointer" },
    progress: { verticalAlign: "baseline" },
    "[hidden]": { display: "none !important" },
    ".lead": { fontSize: "1.25rem", fontWeight: 300 },
    ".display-1": {
        fontSize: "calc(1.625rem + 4.5vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".display-2": {
        fontSize: "calc(1.575rem + 3.9vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".display-3": {
        fontSize: "calc(1.525rem + 3.3vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".display-4": {
        fontSize: "calc(1.475rem + 2.7vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".display-5": {
        fontSize: "calc(1.425rem + 2.1vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".display-6": {
        fontSize: "calc(1.375rem + 1.5vw)",
        fontWeight: 300,
        lineHeight: 1.2
    },
    ".list-unstyled": { paddingLeft: "0", listStyle: "none" },
    ".list-inline": { paddingLeft: "0", listStyle: "none" },
    ".list-inline-item": { display: "inline-block" },
    ".list-inline-item:not(:last-child)": { marginRight: "0.5rem" },
    ".initialism": { fontSize: "0.875em", textTransform: "uppercase" },
    ".blockquote": { marginBottom: "1rem", fontSize: "1.25rem" },
    ".blockquote > :last-child": { marginBottom: "0" },
    ".blockquote-footer": {
        marginTop: "-1rem",
        marginBottom: "1rem",
        fontSize: "0.875em",
        color: "#6c757d"
    },
    ".blockquote-footer::before": { content: "'— '" },
    ".img-fluid": { maxWidth: "100%", height: "auto" },
    ".img-thumbnail": {
        padding: "0.25rem",
        backgroundColor: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "0.25rem",
        maxWidth: "100%",
        height: "auto"
    },
    ".figure": { display: "inline-block" }
}
