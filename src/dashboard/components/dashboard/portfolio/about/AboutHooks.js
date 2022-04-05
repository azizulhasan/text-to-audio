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


  
  // Create table headers consisting of 4 columns.
  const STORY_HEADERS = [
    {
      prop: "profession",
      title: "Profession",
    },
    {
      prop: "portfolioImage",
      title: "Portfolio Image",
    },
    {
      prop: "details",
      title: "Details",
    },
  ];
  export{
    getData,
    postData,
    previewImage,
    STORY_HEADERS,
  };
  