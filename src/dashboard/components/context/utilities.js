/**
 * Load all scripts.
 * @param {url} script url
 */
export const addScripts = (scripts) => {
  let fragment = document.createDocumentFragment();
  [...scripts].forEach((scirpt) => {
    if( true !== window.localStorage.getItem( scirpt ) ){
      let tag = document.createElement("script");
      tag.async = true;
      tag.src = scirpt;
      fragment.appendChild(tag);
      window.localStorage.setItem( scirpt, true );
    }
  });
  document.body.appendChild(fragment)
};

/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
export const postData = async (url = "", data = {}) => {
  // Default options are marked with *

  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    body: data, // body data type must match "Content-Type" header
  });
  const responseData = await response.json(); // parses JSON response into native JavaScript objects

  return responseData;
};

/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
export const postWithoutImage = async (url = "", data = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
    // headers: {
    //   "Content-Type": "application/json",
    // },
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    body: data, // body data type must match "Content-Type" header
  });
  const responseData = await response.json(); // parses JSON response into native JavaScript objects

  return responseData;
};

/**
 * get data methon
 * @param {url} url api url
 * @returns  data mixed.
 */
export const getData = async (url = "") => {
  const response = await fetch(url);
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
  if (typeof keys === "array" && keys.length) {
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
  
   return  day + " " + hr + ":" + min + ampm + " " + date + " " + month + " " + year;
};

  /**
   * Get ifram content
   */
 export  const getIframeContent = (textareaIndex) => {
    let textareaId = document
      .getElementsByTagName("textarea")[textareaIndex]
      .getAttribute("id");
    let iframeContent = document.getElementById(textareaId + "_ifr").contentWindow
      .document.body.innerHTML;
  
    return iframeContent;
  };