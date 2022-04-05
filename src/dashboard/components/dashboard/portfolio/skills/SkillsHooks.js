  /**
 * Post data method.
 * @param {url} url api url
 * @param {method} method request type
 * @returns
 */
 const postData = async (url = "", data = {}) => {
  // Default options are marked with *
  console.log(JSON.stringify(data))
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
   * Add another skill
   */
   const addSkill = () => {
    const icon_col = document.getElementById("skill_col");
    const icon_row = document
      .getElementById("skill_col")
      .firstChild.cloneNode(true);
    icon_col.appendChild(icon_row);
  };

    /**
     * Add another contact
     */
     const addContact = () => {
      const icon_col = document.getElementById("contact_col");
      const icon_row = document
        .getElementById("contact_col")
        .firstChild.cloneNode(true);
      icon_col.appendChild(icon_row);
    };
  
    /**
     * Delete skill row. If skill row length is 1 then before deleting first row clone if 
     * and append it to parrent row.
     */
    const deleteSkill = (e) => {
      let row = e.target.parentElement.parentElement; // get clicked row
      if(e.target.parentElement.parentElement.parentElement.childNodes.length == 1){
        let rowClone = e.target.parentElement.parentElement.parentElement.firstChild.cloneNode(true);
        e.target.parentElement.parentElement.parentElement.appendChild(rowClone);
        e.target.parentElement.parentElement.parentElement.removeChild(row);
        document.getElementById('skill.skill_name').value = ""
        document.getElementById('skill.skill_proficiency').value = ""
      }else{
        e.target.parentElement.parentElement.parentElement.removeChild(row);
      }
    };
  // Create table headers consisting of 4 columns.
  const STORY_HEADERS = [
    {
      prop: "0",
      title: "Skill Name",
    },
    {
      prop: "1",
      title: "Skill Proficiency",
    },
    
  ];
  export{
    STORY_HEADERS,
    deleteSkill,
    getData,
    postData,
    addSkill
  };
  