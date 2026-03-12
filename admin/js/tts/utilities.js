/**
 * 
 * @param {*} value 
 * @returns 
 */
export const isString = function isString(value) {
    return typeof value === 'string' || value instanceof String;
};

/**
 * 
 * @param {*} value 
 * @returns 
 */
export const trim = function (value) {
    return isString(value) ? value.trim() : '';
};

/**
 * 
 * @param {*} text 
 * @returns 
 */
export const splitSentences = function splitSentences(text = '') {

    return text.replace(/\.+/g, '.|').replace(/\?/g, '?|').replace(/\!/g, '!|').split("|").map(function (sentence) {
        return trim(sentence);
    }).filter(Boolean);
};


export const getButtonContent = (buttonId, cssClass, isProLicenseActive) => {
    // return wp.hooks.applyFilters('tts__listening_button', `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="Text To Audio:  Tap to listen post."><div class="tts_button"><span class="dashicons dashicons-controls-play"></span><span>Listen<span></div> </button>`, buttonId)
    let buttonText = window?.ttsObj?.buttonTextArr?.listen_text ?? 'Listen';
    let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.listen_hover_title ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.listen_hover_title : 'Text To Audio: Click to listen post.';

    if (window?.ttsObj?.player_customizations?.[1]?.play) {
        const parser = new DOMParser();
        // convert html string into DOM
        let document = parser.parseFromString(ttsObj?.player_customizations?.[1]?.play, "image/svg+xml");
        let icon = `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="${buttonHoverTitle}" aria-label="${buttonText} audio"><div className="tts_button" aria-hidden="true">${document.documentElement.outerHTML}</div> <span>`;
        return icon + ' ' + buttonText + '<span></span></span></div>';
    }

    return `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="${buttonHoverTitle}" aria-label="${buttonText} audio"><div class="tts_button" aria-hidden="true"><span class="dashicons dashicons-controls-play"></span></div><span>${buttonText}</span> </button>`;
}


export const getButtonSVGIcon = ()=> {
    let color = "#ffffff";
    const settings = ttsObj.settings;

    if (settings?.customize?.color) {
        color = settings.customize.color;
    }
    if(window.wp) {
        return wp.hooks.applyFilters('ttsPlayerCustomizations', {
            "1": {
                play: `<svg width='15px' height='15px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 8' aria-hidden='true'><polygon fill='${color}' points='0 0 0 8 7 4'/> </svg>`,
                pause: `<svg width='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><g id='SVGRepo_bgCarrier' stroke-width='1.5'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'><path opacity='0.1' d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' fill='none'></path><path d='M14 9L14 15' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M10 9L10 15' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' stroke='${color}' stroke-width='2'></path></g></svg>`,
                replay : `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${color}' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${color}'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${color}'></path> </g></svg>`,
                resume : `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${color}' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${color}'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${color}'></path> </g></svg>`,
            }
        })
    }

    return {
        "1": {
            play: `<svg width='15px' height='15px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 8' aria-hidden='true'><polygon fill='${color}' points='0 0 0 8 7 4'/> </svg>`,
            pause: `<svg width='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><g id='SVGRepo_bgCarrier' stroke-width='1.5'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'><path opacity='0.1' d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' fill='none'></path><path d='M14 9L14 15' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M10 9L10 15' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' stroke='${color}' stroke-width='2'></path></g></svg>`,
            replay : `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${color}' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${color}'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${color}'></path> </g></svg>`,
            resume : `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${color}' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${color}'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${color}'></path> </g></svg>`,
        }
    }

}

export  const addHoverColor = (wrapper) => {
    // pick your hover color and default color
    let hoverColor = "#000000";
    let defaultColor = "#000000";
    const allSettings = ttsObj.settings;
    if (allSettings?.customize?.color) {
        defaultColor = allSettings.customize.color;
    }

    if (allSettings?.customize?.hoverTextColor) {
        hoverColor = allSettings.customize.hoverTextColor;
    }else{
        hoverColor = defaultColor;
    }

    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    // change all fill attributes
    svg.querySelectorAll("[fill]").forEach(el => {
        if (el.getAttribute("fill") !== "none") {
            el.setAttribute("fill", hoverColor);
        }
    });

    // change all stroke attributes
    if (svg.hasAttribute("stroke")) {
        svg.setAttribute("stroke", hoverColor);
    }
    svg.querySelectorAll("[stroke]").forEach(el => {
        if (el.getAttribute("stroke") !== "none") {
            el.setAttribute("stroke", hoverColor);
        }
    });
}

export  const addDefaultColor = (wrapper) => {
    let defaultColor = "#000000";
    const allSettings = ttsObj.settings;
    if (allSettings?.customize?.color) {
        defaultColor = allSettings.customize.color;
    }

    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    // reset fill
    svg.querySelectorAll("[fill]").forEach(el => {
        if (el.getAttribute("fill") !== "none") {
            el.setAttribute("fill", defaultColor);
        }
    });
    if (svg.hasAttribute("stroke")) {
        svg.setAttribute("stroke", defaultColor);
    }
    // reset stroke
    svg.querySelectorAll("[stroke]").forEach(el => {
        if (el.getAttribute("stroke") !== "none") {
            el.setAttribute("stroke", defaultColor);
        }
    });
}

export  const setSvgColorOnEvent = (wrapper) => {
    wrapper.addEventListener("mouseenter", () => {
        addHoverColor(wrapper)
    });

    wrapper.addEventListener("mouseleave", () => {
        addDefaultColor(wrapper)
    });
}

var errorCallback = function (error) {
    var errorMessage = 'Unknown error';
    switch (error.code) {
        case 1:
            errorMessage = 'Permission denied';
            break;
        case 2:
            errorMessage = 'Position unavailable';
            break;
        case 3:
            errorMessage = 'Timeout';
            break;
        default:
            errorMessage = 'Timeout';
    }
};

// options to pass in "getCurrentPosition" functions
export const options = {
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
        throw new Error('Geolocation is not supported by this browser.');
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
    var language = window.navigator.language ;
    var request = new XMLHttpRequest();

    var method = 'GET';
    var url =
        'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
        latitude +
        '&longitude=' +
        longitude +
        '&localityLanguage=' + language;
    var async = true;

    request.open(method, url, async);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            let userData = JSON.parse(request.responseText);
            userAddress['continent'] = userData.continent;
            userAddress['countryName'] = userData.countryName;
            userAddress['locality'] = userData.locality;
            userAddress['principalSubdivision'] = userData.principalSubdivision;
            userAddress['city'] = userData.city;
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
            typeof navigator[key] === 'string' ||
            typeof navigator[key] === 'boolean'
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
 export const getUserAddress = async () => {
    await setUserAddress(window.navigator)
    return await  userAddress;
};