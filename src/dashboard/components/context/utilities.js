/**
 * Load all scripts.
 * @param {url} script url
 */
export const addScripts = (scripts) => {
    let fragment = document.createDocumentFragment();
    [...scripts].forEach((scirpt) => {
        if (true !== window.localStorage.getItem(scirpt)) {
            let tag = document.createElement("script");
            tag.async = true;
            tag.src = scirpt;
            fragment.appendChild(tag);
            window.localStorage.setItem(scirpt, true);
        }
    });
    document.body.appendChild(fragment)
};

/**
 * TTS-246: Decide how to encode a request body.
 *
 * Background: front-of-site WAFs (notably Cloudflare's managed ruleset) reject
 * POSTs to /wp-json/* whose bodies are `multipart/form-data` or
 * `application/x-www-form-urlencoded` and contain JSON-shaped strings (CSS
 * selectors with `.`, `{`, quotes, etc. in a `fields` form value). The same
 * payload sent as `application/json` passes the WAF, so we convert text-only
 * FormData to JSON.
 *
 * Exception: FormData that carries a File/Blob CANNOT be JSON-stringified
 * (binary doesn't survive JSON), so we send those as-is and let the browser
 * generate the multipart boundary. File uploads (e.g. Google Cloud service
 * account JSON in the Integrations tab) keep working. The PHP REST handler
 * reads the same param names off `WP_REST_Request` regardless of encoding.
 *
 * @param {*} data FormData | URLSearchParams | string | object | null
 * @returns {{ body: BodyInit, contentType: string | null }}
 *   `contentType=null` means "let fetch/XHR set the boundary" (multipart).
 */
const prepareBody = (data) => {
    if (data == null) {
        return { body: JSON.stringify({}), contentType: 'application/json' };
    }
    if (typeof data === 'string') {
        // Already serialized (caller's responsibility to set type if needed).
        return { body: data, contentType: 'application/json' };
    }
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        // If any entry is a File/Blob, keep as multipart — JSON can't carry binary.
        for (const [, v] of data.entries()) {
            if (typeof Blob !== 'undefined' && v instanceof Blob) {
                return { body: data, contentType: null /* browser sets boundary */ };
            }
        }
        return {
            body: JSON.stringify(Object.fromEntries(data.entries())),
            contentType: 'application/json',
        };
    }
    if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
        return {
            body: JSON.stringify(Object.fromEntries(data.entries())),
            contentType: 'application/json',
        };
    }
    return { body: JSON.stringify(data), contentType: 'application/json' };
};

/**
 * TTS-246: Read a fetch response while tolerating WAF HTML 403/5xx pages.
 *
 * Before this change, a 403 with an HTML body surfaced as
 * `SyntaxError: Unexpected token '<'` — useless for diagnosing the real cause
 * (firewall/CDN block, expired nonce, missing capability, etc.). Now we always
 * return a structured `{ status, message, ... }` shape, and we log a one-line
 * breadcrumb so the dev console makes the cause obvious.
 *
 * Callers that check `res.status` continue to work. Callers that read
 * `res.message` get a human-friendly explanation. Nothing throws.
 */
const parseRestResponse = async (response, url) => {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
        try {
            const json = await response.json();
            if (!response.ok && json && typeof json === 'object' && json.status === undefined) {
                // WP_Error JSON: { code, message, data: { status } }
                json.status = false;
                json.httpStatus = response.status;
            }
            if (!response.ok) {
                // eslint-disable-next-line no-console
                console.error(
                    `[AtlasVoice] REST ${response.status} on ${url || '(unknown URL)'}:`,
                    json && json.message ? json.message : json
                );
            }
            return json;
        } catch (e) { /* fall through */ }
    }
    const text = await response.text().catch(() => '');
    if (!response.ok) {
        const fwHint = response.status === 403
            ? 'Save failed (HTTP 403) — your firewall (Cloudflare/Wordfence/Sucuri) may be blocking this request. See TTS-246.'
            : `Save failed (HTTP ${response.status}).`;
        // eslint-disable-next-line no-console
        console.error(`[AtlasVoice] REST ${response.status} on ${url || '(unknown URL)'}: ${fwHint}`, text.slice(0, 500));
        return {
            status: false,
            httpStatus: response.status,
            code: 'non_json_response',
            message: fwHint,
            body: text.slice(0, 500),
        };
    }
    return { status: true, raw: text };
};

/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
export const postData = async (url = "", data = {}, $method = "POST") => {
    // Default options are marked with *

    let response = '';
    if ($method === 'GET') {
        response = await fetch(url, {
            method: $method, // *GET, POST, PUT, DELETE, etc.
            headers: {
                'X-WP-Nonce': ttsObj.rest_nonce
            },
        });
    } else {
        // TTS-246: send JSON so Cloudflare/WAF doesn't 403 our save requests.
        // FormData with File/Blob still goes as multipart — see prepareBody().
        const { body, contentType } = prepareBody(data);
        const headers = {
            'X-WP-Nonce': ttsObj.rest_nonce,
            'Accept': 'application/json',
        };
        if (contentType) headers['Content-Type'] = contentType;
        response = await fetch(url, {
            method: $method, // *GET, POST, PUT, DELETE, etc.
            body,
            headers,
        });
    }

    return await parseRestResponse(response, url);
};

/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
export const postWithoutImage = async (url = "", data = {}) => {
    // TTS-246: see postData() — JSON bypasses WAF rules that target form bodies.
    // FormData with File/Blob still goes as multipart — see prepareBody().
    const { body, contentType } = prepareBody(data);
    const headers = {
        'X-WP-Nonce': window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
        'Accept': 'application/json',
    };
    if (contentType) headers['Content-Type'] = contentType;
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        body,
        headers,
    });
    return await parseRestResponse(response, url);
};

/**
 * get data methon
 * @param {url} url api url
 * @returns  data mixed.
 */
export const getData = async (url = "") => {
    const response = await fetch(url, {
        headers: {
            'X-WP-Nonce': ttsObj.rest_nonce
        },
    });
    const data = await response.json();
    return data; // parses JSON response into native JavaScript objects
};


let lastUrl = window.location.pathname;
let componentName = "";

new MutationObserver(() => {
    const url = window.location.pathname;
    if (url !== lastUrl) {
        lastUrl = url;
        componentName = getName(lastUrl);
    }
}).observe(document, { subtree: true, childList: true });

/**
 * Get component name
 */
export const getComponentName = () => {
    return componentName ? componentName : getName(window.location.pathname);
};

export const sliceComponentName = () => {
    let component = getComponentName().replace(/\s/g, "").trim().split("/");

    return component[component.length - 1];
};

export const getName = (lastUrl) => {
    let urlArr = lastUrl.split("/");
    let componentArr = "";
    if (urlArr[1] !== "") {
        for (let i = 1; i < urlArr.length; i++) {
            let url = urlArr[i];
            componentArr += " / " + url[0].toUpperCase() + "" + url.slice(1);
        }
    }
    return componentArr;
};

/**
 *
 * @param {coockie_name} name
 * @param {coockie_value} value
 * @param {exprires} days
 */
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

/**
 *
 * @param {coockie_name} name
 * @returns
 */
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 *
 * @param {coockie_name} name
 */
function eraseCookie(name) {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

var errorCallback = function (error) {
    var errorMessage = "Unknown error";
    switch (error.code) {
        case 1:
            errorMessage = "Permission denied";
            break;
        case 2:
            errorMessage = "Position unavailable";
            break;
        case 3:
            errorMessage = "Timeout";
            break;
        default:
            errorMessage = "Timeout";
    }
    console.log(errorMessage);
};

var options = {
    enableHighAccuracy: true,
    timeout: 3000,
    maximumAge: 0,
};

/**
 * get location data of user.
 * @param {window.navigator} navigator
 */
export const setUserAddress = (navigator) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            getLocationData,
            errorCallback,
            options
        );
    } else {
        throw new Error("Geolocation is not supported by this browser.");
    }
};

/**
 * Current location data
 * @param {position} position
 */
let userAddress = {};

function getLocationData(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var request = new XMLHttpRequest();

    var method = "GET";
    var url =
        "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
        latitude +
        "&longitude=" +
        longitude +
        "&localityLanguage=en";
    var async = true;

    request.open(method, url, async);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            let userData = JSON.parse(request.responseText);
            userAddress["continent"] = userData.continent;
            userAddress["countryName"] = userData.countryName;
            userAddress["locality"] = userData.locality;
            userAddress["principalSubdivision"] = userData.principalSubdivision;
            userAddress["city"] = userData.localityInfo.administrative[1].isoName;
        }
    };

    request.send();
}

/**
 * Get user browser data. window.navigator object's data. loop throw the object and get all string
 * and boolean data
 * @param {navigator} navigator
 * @returns
 */
export const getUserBrowserData = (navigator) => {
    let browserData = {};
    for (var key in navigator) {
        if (
            typeof navigator[key] === "string" ||
            typeof navigator[key] === "boolean"
        ) {
            browserData[key] = navigator[key];
        }
    }

    return browserData;
};
/**
 * city, country, division, locality etc.
 * @returns user location data
 */
export const getUserAddress = () => {
    return userAddress;
};
/**
 * set sessionStorage
 * @param {object} data data object with key and value
 */
export const setSessionStorage = (data) => {
    if (typeof data === "object") {
        Object.keys(data).map((key) => {
            if (data[key]) {
                window.sessionStorage.setItem(key, data[key]);
            }
        });
    }
};
/**
 *
 * @param {array} keys session storage keys is array.
 */
export const getSessionStorage = (keys = []) => {
    let sessionData = {};
    if (typeof keys === "array" && keys.length) {
        for (let i = 0; i < keys.length; i++) {
            sessionData[keys[i]] = window.sessionStorage.getItem(keys[i]);
        }
    } else {
        let session = window.sessionStorage;
        for (let key in session) {
            let keyData = window.sessionStorage.getItem(key);
            if (keyData) {
                sessionData[key] = keyData;
            }
        }
    }

    return sessionData;
};
/**
 * Set localStorage
 * @param {object} data data object with key and value
 */
export const setLocalStorage = (data) => {
    if (
        data === "undefined" ||
        data === null ||
        data === "" ||
        Array.isArray(data) ||
        typeof data === "string" ||
        (typeof data === "object" && Object.keys(data).length === 0)
    )
        return;
    Object.keys(data).map((key) => {
        if (data[key]) {
            window.localStorage.setItem(key, data[key]);
        }
    });

    let storageData = {};
    let storage = window.localStorage;
    for (let key in storage) {
        if (data.hasOwnProperty(key)) {
            let keyData = window.localStorage.getItem(key);
            if (keyData) {
                storageData[key] = keyData;
            }
        }
    }

    return storageData;
};

/**
 *
 * @param {array} keys local storage keys is array.
 */
export const getLocalStorage = (keys = []) => {
    let localData = {};
    if (Array.isArray(keys) && keys.length) {
        for (let i = 0; i < keys.length; i++) {
            localData[keys[i]] = window.localStorage.getItem(keys[i]);
        }
    } else {
        let storage = window.localStorage;
        for (let key in storage) {
            let keyData = window.localStorage.getItem(key);
            if (keyData) {
                localData[key] = keyData;
            }
        }
    }

    return localData;
};

export const authenTicateUser = () => {
    const Auth = {
        session: getSessionStorage(),
        storage: getLocalStorage(),
    };
    if (
        (Auth.session.email === undefined && Auth.storage.email === undefined) ||
        (Auth.session.password === undefined && Auth.storage.password === undefined)
    ) {
        window.location.href = process.env.REACT_APP_URL + "/login";
    }
};

export const getUserName = () => {
    return window.sessionStorage.getItem("email")
        ? window.sessionStorage.getItem("email").split("@")[0]
        : window.localStorage.getItem("email")
            ? window.localStorage.getItem("email").split("@")[0]
            : "";
};
export const logout = () => {
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("password");
    window.sessionStorage.removeItem("email");
    window.sessionStorage.removeItem("password");

    window.location.href = process.env.REACT_APP_URL + "/login";
};

export const hideMenuOnScroll = () => {
    if (window.innerWidth > 991) {
        window.onscroll = function () {
            if (window.pageYOffset >= 1800) {
                document.getElementById("header").style.display = "none";
                document.getElementById("header").className = "";
            } else {
                document.getElementById("header").style.display = "block";
                document.getElementById("header").className =
                    "d-flex flex-column justify-content-center";
            }
        };
    }
};

export const getFormattedDate = () => {
    var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    var days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    var d = new Date();
    var day = days[d.getDay()];
    var hr = d.getHours();
    var min = d.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    var ampm = "am";
    if (hr > 12) {
        hr -= 12;
        ampm = "pm";
    }
    var date = d.getDate();
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    var x = document.getElementById("time");

    return day + " " + hr + ":" + min + ampm + " " + date + " " + month + " " + year;
};

/**
 * Get ifram content
 */
export const getIframeContent = (textareaIndex) => {
    let textareaId = document
        .getElementsByTagName("textarea")[textareaIndex]
        .getAttribute("id");
    let iframeContent = document.getElementById(textareaId + "_ifr").contentWindow
        .document.body.innerHTML;

    return iframeContent;
};


export const isPro = (hasPro, isProLicenseActive) => {
    return hasPro && isProLicenseActive;
}


const unsecuredCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy')
        alert('Copied')

    } catch (err) {
        console.error('Unable to copy to clipboard', err)
    }

    document.body.removeChild(textArea)
};


/**
 * Copies the text passed as param to the system clipboard
 * Check if using HTTPS and navigator.clipboard is available
 * Then uses standard clipboard API, otherwise uses fallback
 */
export const copyToClipBoard = (id, shouldSelect = true, message = "Copied", callBack = alert) => {
    /* Get the text field */
    var copyText = document.getElementById(id);

    /* Select the text field */
    if (shouldSelect) {
        copyText.select();
        copyText.setSelectionRange(0, 99999);
    }

    if (window.isSecureContext && navigator.clipboard) {
        /* Copy the text inside the text field */
        navigator.clipboard
            .writeText(copyText.value)
            .then(() => {
                // toast('Copied the text: ' + copyText.value);
                callBack(message)
            })
            .catch((e) => {
                callBack("Something went wrong! " + e.errorMessage());
                // toast('Something went wrong! ');
            });
    } else {
        unsecuredCopyToClipboard(copyText.value);
    }

};


export const isFreemiusActive = (res) => {
    let is_freemiu_active = true;

    if (!res.is_pro_license_active) {
        is_freemiu_active = false
    }

    if (res.ttsp_fs_methods.length < 10) {
        is_freemiu_active = false
    }

    if (res.ttsp_fs_properties.length < 10) {
        is_freemiu_active = false
    }

    if (!is_freemiu_active) {
        window.ttsObj.is_pro_license_active = false
        window.ttsObj.is_pro_active = false
        window.ttsObjPro.is_pro_license_active = false
        window.ttsObjPro.is_pro_active = false
    }

    return is_freemiu_active;
};


export const gttsSupportedLanguages = () => {
    return {
        // ── African ─────────────────────────────────────────────────────────
        'af':    'Afrikaans',
        'am':    'Amharic',
        'sw':    'Swahili',

        // ── Arabic ──────────────────────────────────────────────────────────
        'ar':    'Arabic',

        // ── Armenian ────────────────────────────────────────────────────────
        'hy':    'Armenian',

        // ── Basque / Catalan / Galician ─────────────────────────────────────
        'eu':    'Basque',
        'ca':    'Catalan',
        'gl':    'Galician',

        // ── Chinese ─────────────────────────────────────────────────────────
        'zh':        'Chinese',
        'zh-cn':     'Chinese (Mandarin/China)',
        'zh-tw':     'Chinese (Mandarin/Taiwan)',
        'zh-yue':    'Chinese (Cantonese)',
        'yue-hant-hk': 'Chinese Cantonese (Hong Kong)',

        // ── Dutch ───────────────────────────────────────────────────────────
        'nl':    'Dutch',

        // ── English ─────────────────────────────────────────────────────────
        'en':    'English',
        'en-au': 'English (Australia)',
        'en-in': 'English (India)',
        'en-ng': 'English (Nigeria)',
        'en-uk': 'English (United Kingdom)',
        'en-us': 'English (United States)',

        // ── French ──────────────────────────────────────────────────────────
        'fr':    'French',
        'fr-ca': 'French (Canada)',

        // ── German ──────────────────────────────────────────────────────────
        'de':    'German',

        // ── Greek ───────────────────────────────────────────────────────────
        'el':    'Greek',

        // ── Hebrew ──────────────────────────────────────────────────────────
        'he':    'Hebrew',

        // ── Hungarian ───────────────────────────────────────────────────────
        'hu':    'Hungarian',

        // ── Icelandic ───────────────────────────────────────────────────────
        'is':    'Icelandic',

        // ── Indonesian / Malay ──────────────────────────────────────────────
        'id':    'Indonesian',
        'ms':    'Malay',

        // ── Italian ─────────────────────────────────────────────────────────
        'it':    'Italian',

        // ── Japanese ────────────────────────────────────────────────────────
        'ja':    'Japanese',

        // ── Korean ──────────────────────────────────────────────────────────
        'ko':    'Korean',

        // ── Latin ───────────────────────────────────────────────────────────
        'la':    'Latin',

        // ── Macedonian ──────────────────────────────────────────────────────
        'mk':    'Macedonian',

        // ── Portuguese ──────────────────────────────────────────────────────
        'pt':    'Portuguese',
        'pt-br': 'Portuguese (Brazil)',
        'pt-pt': 'Portuguese (Portugal)',

        // ── Romanian ────────────────────────────────────────────────────────
        'ro':    'Romanian',

        // ── Russian ─────────────────────────────────────────────────────────
        'ru':    'Russian',

        // ── Scandinavian ────────────────────────────────────────────────────
        'da':    'Danish',
        'fi':    'Finnish',
        'no':    'Norwegian',
        'sv':    'Swedish',

        // ── Slavic ──────────────────────────────────────────────────────────
        'bg':    'Bulgarian',
        'bg-bg': 'Bulgarian (Bulgaria)',
        'bs':    'Bosnian',
        'hr':    'Croatian',
        'cs':    'Czech',
        'lv':    'Latvian',
        'lt':    'Lithuanian',
        'pl':    'Polish',
        'sr':    'Serbian',
        'sk':    'Slovak',
        'uk':    'Ukrainian',

        // ── South Asian ─────────────────────────────────────────────────────
        'bn':    'Bengali',
        'gu':    'Gujarati',
        'hi':    'Hindi',
        'kn':    'Kannada',
        'ml':    'Malayalam',
        'mr':    'Marathi',
        'ne':    'Nepali',
        'pa':    'Punjabi',
        'si':    'Sinhala',
        'ta':    'Tamil',
        'te':    'Telugu',
        'ur':    'Urdu',

        // ── Southeast Asian ─────────────────────────────────────────────────
        'fil-ph': 'Filipino (Philippines)',
        'jv':    'Javanese',
        'km':    'Khmer',
        'my':    'Burmese',
        'su':    'Sundanese',

        // ── Spanish ─────────────────────────────────────────────────────────
        'es':    'Spanish',
        'es-ar': 'Spanish (Argentina)',
        'es-es': 'Spanish (Spain)',
        'es-us': 'Spanish (United States)',

        // ── Thai ────────────────────────────────────────────────────────────
        'th':    'Thai',

        // ── Turkish ─────────────────────────────────────────────────────────
        'tr':    'Turkish',

        // ── Vietnamese ──────────────────────────────────────────────────────
        'vi':    'Vietnamese',

        // ── Welsh ───────────────────────────────────────────────────────────
        'cy':    'Welsh',

        // ── Estonian ────────────────────────────────────────────────────────
        'et':    'Estonian',

        // ── Albanian ────────────────────────────────────────────────────────
        'sq':    'Albanian',
    }
}

/**
 * Check if all keys in an object are numeric.
 *
 * @param {Object} obj - The object to check.
 * @return {boolean} True if all keys are numeric, false otherwise.
 */
export const areAllKeysNumeric = (obj) => {
    return Object.keys(obj).every(key => {
        return !isNaN(Number(key))
    });
}

export function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

export const chatGPTLanguages = () => {
    return {
        af: "Afrikaans",
        ar: "Arabic",
        hy: "Armenian",
        az: "Azerbaijani",
        be: "Belarusian",
        bs: "Bosnian",
        bg: "Bulgarian",
        ca: "Catalan",
        zh: "Chinese",
        hr: "Croatian",
        cs: "Czech",
        da: "Danish",
        nl: "Dutch",
        en: "English",
        et: "Estonian",
        fi: "Finnish",
        fr: "French",
        gl: "Galician",
        de: "German",
        el: "Greek",
        he: "Hebrew",
        hi: "Hindi",
        hu: "Hungarian",
        is: "Icelandic",
        id: "Indonesian",
        it: "Italian",
        ja: "Japanese",
        kn: "Kannada",
        kk: "Kazakh",
        ko: "Korean",
        lv: "Latvian",
        lt: "Lithuanian",
        mk: "Macedonian",
        ms: "Malay",
        mr: "Marathi",
        mi: "Maori",
        ne: "Nepali",
        no: "Norwegian",
        fa: "Persian",
        pl: "Polish",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        sr: "Serbian",
        sk: "Slovak",
        sl: "Slovenian",
        es: "Spanish",
        sw: "Swahili",
        sv: "Swedish",
        tl: "Tagalog",
        ta: "Tamil",
        th: "Thai",
        tr: "Turkish",
        uk: "Ukrainian",
        ur: "Urdu",
        vi: "Vietnamese",
        cy: "Welsh"
    };
}

export const CHATGPT_CLASSIC_VOICES = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer'];

export const GPT4O_MINI_TTS_VOICES = [
    'alloy', 'ash', 'ballad', 'cedar', 'coral', 'echo',
    'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse'
];

export const chatGPTInstructionPresets = (languageName) => {
    const { __ } = wp.i18n;
    return [
        {
            key: 'native',
            /* translators: %s: language name e.g. "Italian" */
            label: __('Native speaker', 'text-to-audio'),
            value: `Speak as a native ${languageName} speaker with natural pronunciation and intonation.`,
        },
        {
            key: 'slow',
            label: __('Slow and clear', 'text-to-audio'),
            value: `Speak slowly and clearly in ${languageName}, enunciating each word distinctly.`,
        },
        {
            key: 'warm',
            label: __('Warm and friendly', 'text-to-audio'),
            value: `Speak in a warm, friendly tone as a native ${languageName} speaker.`,
        },
        {
            key: 'newsreader',
            label: __('Professional newsreader', 'text-to-audio'),
            value: `Read like a professional ${languageName} news anchor with clear, authoritative delivery.`,
        },
        {
            key: 'storyteller',
            label: __('Storyteller', 'text-to-audio'),
            value: `Narrate like a ${languageName} storyteller with expressive, engaging delivery.`,
        },
        {
            key: 'custom',
            label: __('Custom', 'text-to-audio'),
            value: '',
        },
    ];
};


export const getMultilingualActiveLanguages = (ttsObjPro) => {
    // Initialize an empty object
    let languageObject = {};
    if (ttsObjPro?.compatible?.['gtranslate/gtranslate.php']) {
        let gtranslateActiveLanguages = ttsObjPro?.compatible?.['gtranslate/gtranslate.php']?.allowed_languages;
        // Populate the object using a loop
        for (const langCode of gtranslateActiveLanguages) {
            languageObject[langCode] = langCode;
        }
    } else if (ttsObjPro?.compatible?.['sitepress-multilingual-cms/sitepress.php']) {
        let gtranslateActiveLanguages = ttsObjPro?.compatible?.['sitepress-multilingual-cms/sitepress.php']?.active_languages;

        let active_languages = Object.keys(gtranslateActiveLanguages);

        // Populate the object using a loop
        for (const langCode of active_languages) {
            languageObject[langCode] = gtranslateActiveLanguages[langCode].english_name;
        }
    } else if (ttsObjPro?.compatible?.['translatepress-multilingual/index.php']) {
        let activeLanguages = ttsObjPro?.compatible?.['translatepress-multilingual/index.php']?.data;
        // Populate the object using a loop
        for (const langCode of activeLanguages) {
            languageObject[langCode] = langCode;
        }
    }

    return languageObject;
}