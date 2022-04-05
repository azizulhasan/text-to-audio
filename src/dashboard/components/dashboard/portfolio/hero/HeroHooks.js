/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
const postData = async (url = "", data = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
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
const getData = async (url = "") => {
  const response = await fetch(url);
  const data = await response.json();
  return data; // parses JSON response into native JavaScript objects
};

/**
 * Preveiw Image
 */
const previewImage = (e) => {
  let imgUrl = document.getElementById("previewImage");
  const url = URL.createObjectURL(e.target.files[0]);
  imgUrl.src = url;
};

/**
 * Add another social icon with url
 */
const addSocialIcon = () => {
  const icon_col = document.getElementById("social_icon_col");
  const icon_row = document
    .getElementById("social_icon_col")
    .firstChild.cloneNode(true);
  icon_col.appendChild(icon_row);
};

/**
 * Delete hero row. If hero row length is 1 then before deleting first row clone if
 * and append it to parrent row.
 */
const deleteSocialIcon = (e) => {
  let row = e.target.parentElement.parentElement; // get clicked row
  if (
    e.target.parentElement.parentElement.parentElement.childNodes.length == 1
  ) {
    let rowClone =
      e.target.parentElement.parentElement.parentElement.firstChild.cloneNode(
        true
      );
    e.target.parentElement.parentElement.parentElement.appendChild(rowClone);
    e.target.parentElement.parentElement.parentElement.removeChild(row);
    document.getElementById("hero.social_icon").value = "";
    document.getElementById("hero.social_icon_url").value = "";
  } else {
    e.target.parentElement.parentElement.parentElement.removeChild(row);
  }
};

const socialIcons = [
  "facebook",
  "linkedin",
  "github",
  "twitter",
  "instagram",
  "hackerrank",
  "stackoverflow",
  "leetcode",
  "skype",
  "zoom",
];

// Create table headers consisting of 4 columns.
const STORY_HEADERS = [
  {
    prop: "title",
    title: "Title",
  },
  {
    prop: "profession",
    title: "Profession",
  },
  {
    prop: "backgroundImage",
    title: "backgroundImage",
  },
  {
    prop: "backgroundImageOpacity",
    title: "backgroundImageOpacity",
  },
];
export{
  getData,
  postData,
  previewImage,
  addSocialIcon,
  deleteSocialIcon,
  socialIcons,
  STORY_HEADERS,
};
