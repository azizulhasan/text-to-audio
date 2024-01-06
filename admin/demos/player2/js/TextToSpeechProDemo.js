

document.addEventListener("DOMContentLoaded", function () {
    /**
     * Define TextToSpeechPro class if TextToSpeech class exists.
     * 
     */
    let id;
    id = setInterval(() => {
        if (window.speechSynthesis.getVoices().length !== 0 && window?.TextToSpeech) {
            clearInterval(id);
            class TextToSpeechPro extends window.TextToSpeech {
                buttonId
                title = ''
                contents = ''
                path = ''
                storedContent = ''
                compatible = {}
                constructor(buttonId, content = '', button = null, TTS = window.TTS) {
                    super(buttonId, content, button, TTS);
                    this.buttonId = buttonId
                    this.#setTitle(TTS)
                    this.#setPath(TTS)
                    this.content = this.#getContent(content, TTS)
                    this.storedContent = this.#getStoredContent(this.content);
                    //TODO highlight the text in the future.
                    // wp.hooks.addAction('tts_high_light_text', 'ttsPro', this.highlightText, 10, 2)


                }

                onAValueChanged(handler) {
                    console.log(handler)
                }

                #getStoredContent(content) {

                    let storedContent = JSON.parse(window.sessionStorage.getItem('tts_stored_content'))
                    if (!storedContent?.url || storedContent?.url !== window.location.href) {
                        window.sessionStorage.setItem('tts_stored_content', JSON.stringify({
                            content: content,
                            url: window.location.href
                        }))
                    }

                    storedContent = JSON.parse(window.sessionStorage.getItem('tts_stored_content'));
                    return storedContent?.content ? storedContent?.content : "";
                }
                #setPath(tts) {
                    if (tts?.extra) {
                        this.path = tts.extra[this.buttonId].date
                    }
                }
                #setTitle(tts) {
                    if (tts?.extra) {
                        this.title = tts.extra[this.buttonId].title
                    } else {
                        this.title = 'Demo Content'
                    }
                    this.title = this.title.replace(/[^a-zA-Z ]/g, "");
                    this.title = this.title.split(' ').join('_')
                    this.title = this.title + "__lang=" + tts.settings.listening.tta__listening_lang
                    this.title = this.title + "__voice=" + tts.settings.listening.tta__listening_voice
                }



                getData(shouldAsingThis = true) {
                    if (shouldAsingThis) {
                        window.TextToSpeechPro = this
                    }
                    return this;
                }

                #getContent(content, tts) {
                    let domContent = ''

                    let selectors = tts.settings?.settings?.settings?.tta__settings_css_selectors;
                    if (!selectors && !Array.isArray(selectors)) {
                        return content;
                    }
                    selectors = selectors.split('\n');

                    if (selectors.length === 0 || selectors[0] == '') {
                        return content;
                    }


                    for (let i = 0; i < selectors.length; i++) {

                        let currentSelector = selectors[i].trim()
                        if (currentSelector) {
                            let content = document.querySelector(currentSelector)

                            // Extract text using textContent
                            if (content) {
                                domContent += ' ' + content.textContent || content.innerText;
                            }

                        }
                    }

                    if (domContent) {
                        let buttonContent = document.querySelector('#tts__listent_content_' + this.buttonId)
                        // Extract text using textContent
                        buttonContent = buttonContent?.textContent || buttonContent?.innerText;

                        domContent = domContent.replace(buttonContent, '');

                        domContent = domContent.replaceAll('\n', '')

                        return domContent;
                    }

                    return content;

                }
            }

            window.TextToSpeechPro = TextToSpeechPro
            window.TextToSpeechPro2 = TextToSpeechPro
            let buttons = [...document.querySelectorAll('.tts__listent_content')]
            if (buttons.length) {
                buttons.map(button => {
                    let buttonId = button.getAttribute('data-id')
                    new TextToSpeechPro(buttonId, window.TTS.contents[buttonId], button, window.TTS)

                })
            }


        }
    }, 1000);

});




