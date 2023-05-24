// Create a class for the element
class TTSPlayButton extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    // Create spans
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');
    wrapper.innerHTML = `<button id="tta__listent_content_1" class="tta__listent_content " type="button" title="Text To Audio:  Tap to listen post."><div class="tta_button"><span class="dashicons dashicons-controls-play"></span> <span> Listen<span></span></span></div> </button>`

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');


    console.log(this.getAttribute('data-id'))
    // console.log(buttonId)
    // console.log(ttsContent)
    // console.log(ttsListeningSettings)

    this.addEventListener('click', function (e) {
      console.log(e.target)
    })

    style.textContent = `
      .wrapper {
        position: relative;
      }

      .info {
        font-size: 0.8rem;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        border-radius: 10px;
        opacity: 0;
        transition: 0.6s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }

      img {
        width: 1.2rem;
      }

      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
      }
    `;

    // Attach the created elements to the shadow dom
    shadow.appendChild(style);
    shadow.appendChild(wrapper);
  }
}

// Define the new element
customElements.define('tts-play-button', TTSPlayButton);
