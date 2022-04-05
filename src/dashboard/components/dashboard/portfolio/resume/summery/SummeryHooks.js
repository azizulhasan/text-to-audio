/**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
 const postData = async (url = "", data = {}) => {
    // Default options are marked with *
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      body: JSON.stringify(data), // body data type must match "Content-Type" header
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
   * Get ifram content
   */
const getIframeContent = ()=> {
    let textareaId = document.getElementsByTagName('textarea')[1].getAttribute('id');
    let iframeContent  = document.getElementById(textareaId+"_ifr").contentWindow.document.body.innerHTML;

    return iframeContent;
}
  
  // Create table headers consisting of 4 columns.
  const STORY_HEADERS = [
    {
      prop: "summery_title",
      title: "Summery Title",
    },
    {
      prop: "name",
      title: "Name",
    },
    {
      prop: "summery",
      title: "Summery",
    },
  ];


  export{
    getData,
    postData,
    getIframeContent,
    STORY_HEADERS,
  };
  