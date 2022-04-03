

var  record__status = 'record';
var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
var SpeechGrammar = window.SpeechGrammar || webkitSpeechGrammar;
var SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
var recognition = new SpeechRecognition();
var grammar = '#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;'
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
var newGrammar = new SpeechGrammar();
newGrammar.src = '#JSGF V1.0; grammar names; public <name> = chris | kirsty | mike;'
speechRecognitionList[1] = newGrammar; // should add the new SpeechGrammar object to the list
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;




/**
 * Listen content.
 */
 var listen_status = 'listen'
if ("speechSynthesis" in window) {
  var utterence = new SpeechSynthesisUtterance();
  var voices = speechSynthesis.getVoices();
  utterence.voice = voices[0];
  utterence.volume = 1; // From 0 to 1
  utterence.rate = 1; // From 0.1 to 10
  utterence.pitch = 2; // From 0 to 2
  utterence.lang = "en-US";
  //console.log(utterence)
}else {
  console.log("Speech speechSynthesis not supported 😢");
  // code to handle error
}


localStorage.setItem('recordStarted', false)

/**
 * Start recording.
 * @param {string} textarea_id 
 */
function startRecording(textarea_id = 'content_ifr') {
  /**
   * Stop listening before recording.
   */
   speechSynthesis.cancel();

  let record_btn = document.getElementById('wpa__start__record')
  if (record__status == 'stop') {
    record__status = 'record';
    recognition.stop()
    localStorage.setItem('recordStarted', false)
    record_btn.innerHTML = 'Start'
  }else if(record__status == 'record'){
    if(localStorage.getItem('recordStarted') == null  || localStorage.getItem('recordStarted') == 'false'){
      localStorage.setItem('recordStarted', true)
      recognition.start()
    }
    record__status = 'stop';
    record_btn.innerHTML = 'Stop'
  }
  
  let textarea__content = '';
  console.log(textarea_id)
  if(textarea_id == 'content_ifr'){
     textarea__content = document.getElementById(textarea_id).contentWindow.document.body;
  }else{
    textarea__content = document.getElementById(textarea_id)
  }
  console.log(textarea__content.innerHTML);


  let current_text = "";
  recognition.onresult = function (event) {
    let event__length = event.results.length;
    current_text = event.results[event__length - 1][0].transcript + ".";
    current_text = captalizeString(current_text)
    let previous_text = textarea__content.innerHTML;
    
    textarea__content.innerHTML = previous_text + current_text;
  };

};

/**
 * Capitalize String.
 */
function captalizeString(string){
  if(string[0] !== ' '){
    return string[0].toUpperCase()+string.slice(1)
  }else{
    return ' '+string[1].toUpperCase()+string.slice(2)
  }
}

/**
 * 
 * restart recording
 */
 recognition.onsoundend = function(){
  record__status = 'record';
  document.getElementById('wpa__start__record').innerHTML = 'Start'
}



/**
 * Listent/Pause/Resume content.
 */
function listenCotentInDashboard(){
  let listen_btn = document.getElementById('wpa__listent_content');
  let  textarea__content = document.getElementById('content_ifr').contentWindow.document.body;
  utterence.text = textarea__content.innerHTML;
  /**
   * Stop recording before listening.
   */
  recognition.stop();
  startReadingContent(listen_btn)
}


/**
 * Start Reading content
 */

function startReadingContent(){
  let listen_btn = document.getElementById('wpa__listent_content');
  if(listen_status == 'listen'){
    speechSynthesis.speak(utterence);
    listen_btn.innerHTML = 'Pause'
    listen_status = 'pause';
  }else if(listen_status == 'pause'){
    speechSynthesis.pause();
    listen_btn.innerHTML = 'Resume';
    listen_status = 'resume';
  }else if(listen_status == 'resume'){
    listen_btn.innerHTML = 'Pause';
    listen_status = 'pause';
    speechSynthesis.resume();
  }
}

/**
 * Read the blog
 */



function listenCotentInFrontend(){

  let  content = document.getElementsByClassName('entry-content')
  let  title = document.getElementsByClassName('entry-title')
  let  posted_on = document.getElementsByClassName('post-on')
  let  posted_by = document.getElementsByClassName('post-author')
  
  let read__content = title[0].innerHTML;
  // read__content += "posten on "+posted_on[0].innerHTML;
  // read__content += "posten by "+posted_by[0].innerHTML;
  read__content += content[0].innerHTML;
  utterence.text = read__content;
  startReadingContent()
}


/**
 * After ending reading the content.
 */
utterence.addEventListener('end', function(event) {
  document.getElementById("wpa__listent_content").innerHTML = 'Listen';
  listen_status = 'listen';
});



Object.values(document.getElementsByTagName('textarea')).forEach((textarea, index)=>{
  console.log(textarea.getAttribute('id'))
  textarea.addEventListener('focus', function(){
    if(textarea.getAttribute('id') == 'content'){
      startRecording('content_ifr')
    }else{
      startRecording(textarea.getAttribute('id'))

    }
    let record_btn = document.getElementById('wpa__start__record')
    record__status = 'record';
    record_btn.innerHTML = 'Stop'
  })
})

// setTimeout(()=>{
//   document.getElementsByTagName('textarea').map(textarea=>{
//     console.log(textarea.getAttribute('id'))
//   })
// },1000)