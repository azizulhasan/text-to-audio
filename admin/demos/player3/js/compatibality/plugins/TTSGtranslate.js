
import { setCORS } from "google-translate-api-browser";

const translate = setCORS(ttsObjPro.cors_domain);

class TTSGtranslate {
    textToSpeechPro = null
    constructor(textToSpeechPro) {
        this.textToSpeechPro = textToSpeechPro;
    }

    async #translateToCurrentLanguage(contentText, options) {
        let BrowserSupport = window.BrowserSupport;
        let parent = this.textToSpeechPro;
        let translatedSuccessfully = false;
        parent.browser = new BrowserSupport(window.ttsObj, window.speechSynthesis.getVoices(), window.TTS.settings.listening.tta__listening_lang, window.TTS.settings.listening.tta__listening_voice)
        let lang = parent.browser.setLanguage(options.to)

        if (lang.isSupported) {

            let textArr = [];
            let charlen = 1000;
            for (let i = 0; i < 10000000; i += charlen) {
                let content = contentText.substr(i, charlen);
                if (content == '') {
                    break;
                }
                let arr = this.#getTrimmedContent(content);
                await translate(arr.content, options)
                    .then(res => {
                        if (res?.text) {
                            textArr.push(res.text)
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    });

                i -= arr.lastSentenceLen;
            }

            if (textArr.length) {
                window.TTS.contents[parent.buttonId] = textArr.join('.');
                let voice = parent.browser.getVoiceByLangCode(lang.lang)
                parent.browser.setVoice(voice)
                window.TextToSpeechPro.browser = parent.browser;
                window.TTS.settings.listening.tta__listening_lang = lang.lang;
                window.TTS.settings.listening.tta__listening_voice = voice;
            }
            translatedSuccessfully = true;

        }

        return translatedSuccessfully;

    }

    #getTrimmedContent(content, charLen, sentenceDelimiter = ".") {
        const contentArray = content.split(sentenceDelimiter);
        const lastSentence = contentArray.length > 1 ? contentArray[contentArray.length - 1] : '';
        const lastSentenceLen = lastSentence.length;

        if (lastSentenceLen) {
            contentArray.pop();
            content = contentArray.join(sentenceDelimiter) + sentenceDelimiter;
        } else {
            content = contentArray.join(sentenceDelimiter) + sentenceDelimiter;
        }

        return {
            content: content,
            lastSentenceLen: lastSentenceLen
        };
    }

    async gtranslate(selector, currentContent = '') {
        let textToSpeechPro = this.textToSpeechPro;
        let isObserving = false;
        let defaultLang = this.#getCountryCode(window.TTS.settings.listening.tta__listening_lang)
        let changedDeleted = false
        // let observer = new MutationObserver(function (mutations) {
        //     let translatedSuccessfully = false
        //     if (mutations.length < 6) {
        //         let translateToLang = self.#getSelectedGTLang()
        //         console.log({ mutations: translateToLang, mutationslen: mutations.length })
        //         mutations.forEach(async function (mutation) {
        //             isObserving = true;
        //             if ((mutations.length == 2 && !changedDeleted) || (mutation?.addedNodes?.length && mutation?.removedNodes?.length && !changedDeleted)) {
        //                 changedDeleted = true;

        //                 console.log({ translateToLang })
        //                 // console.log("removed nodes", mutation.removedNodes[0].nodeValue);
        //                 // console.log("added nodes", mutation.addedNodes[0].nodeValue);
        //                 let contentText = currentContent ? currentContent : textToSpeechPro.storedContent;
        //                 let options = {
        //                     // client: 'webapp', // 'gtx' | 
        //                     from: defaultLang,
        //                     to: translateToLang,
        //                     // hl: LangKey;
        //                     // raw: boolean;
        //                     // tld: string;
        //                 }
        //                 translatedSuccessfully = await self.#translateToCurrentLanguage(contentText, options)
        //                 if (translatedSuccessfully) {
        //                     textToSpeechPro = textToSpeechPro.getData();
        //                     textToSpeechPro.proxy.listenStatus = 'listen'
        //                     changedDeleted = false
        //                 }
        //             }

        //         });
        //     }

        // });

        // var config = {
        //     childList: true,
        //     subtree: true,
        //     characterData: true,
        //     attributes: true
        // };


        let selectorData = this.#getGtranslateSelectorData(selector);

        if (selectorData.observe) {
            let options = {
                // client: 'webapp', // 'gtx' | 
                from: defaultLang,
                // to: translateToLang,
                // hl: LangKey;
                // raw: boolean;
                // tld: string;
            }
            let self = this;
            selectorData.observe.addEventListener('click', async function (e) {
                let contentText = currentContent ? currentContent : textToSpeechPro.storedContent;
                // console.log(e.target)
                if (e.target.nodeName == 'A') {
                    options.to = e.target.getAttribute('data-gt-lang')
                    let translatedSuccessfully = await self.#translateToCurrentLanguage(contentText, options)
                    if (translatedSuccessfully) {
                        textToSpeechPro = textToSpeechPro.getData();
                        textToSpeechPro.proxy.listenStatus = 'listen'
                    }
                } else if (e.target.nodeName == 'SELECT') {
                    console.log(e.target.nodeName)
                } else if (e.target.nodeName == 'SPAN') {
                    // console.log(e.target.parentElement)
                    options.to = e.target.previousElementSibling.getAttribute('alt')
                    let translatedSuccessfully = await self.#translateToCurrentLanguage(contentText, options)
                    if (translatedSuccessfully) {
                        textToSpeechPro = textToSpeechPro.getData();
                        textToSpeechPro.proxy.listenStatus = 'listen'
                    }
                } else if (e.target.nodeName == 'IMG') {
                    // console.log(e.target.parentElement)
                    options.to = e.target.getAttribute('alt')
                    let translatedSuccessfully = await self.#translateToCurrentLanguage(contentText, options)
                    if (translatedSuccessfully) {
                        textToSpeechPro = textToSpeechPro.getData();
                        textToSpeechPro.proxy.listenStatus = 'listen'
                    }
                }

            })

        }

        // first time load
        if (!isObserving) {
            let selectedLang = this.#getSelectedGTLang()
            let defaultLang = this.#getCountryCode(window.TTS.settings.listening.tta__listening_lang)
            if (selectedLang !== defaultLang) {
                let contentText = currentContent ? currentContent : textToSpeechPro.storedContent;
                let options = {
                    from: defaultLang,
                    to: selectedLang,
                }
                this.#translateToCurrentLanguage(contentText, options)
            }
        }
    }

    #getSelectedGTLang() {
        let selectedLang = null;
        let dropdown = document.getElementsByClassName('gt_selector')
        if (dropdown.length) {
            selectedLang = dropdown[0].value.split('|')[1]
        } else {
            let currentGlang = [...document.querySelectorAll('[data-gt-lang]')];
            let classes = [
                'gt-current-lang',
                'gt-current',
                'gt_current',
            ]
            let shouldBreak = false;
            for (let i = 0; i < currentGlang.length; i++) {
                let option = currentGlang[i]
                for (let j = 0; j < classes.length; j++) {
                    let currentClass = classes[j];
                    if (option.classList.contains(currentClass)) {
                        selectedLang = option.getAttribute('data-gt-lang')
                        shouldBreak = true;
                        break;
                    }
                }

                if (shouldBreak) {
                    break;
                }
            }
        }
        return wp.hooks.applyFilters('tts_pro_get_selected_gt_lang', selectedLang)
    }

    #getGtranslateSelectorData(selector) {
        let observerElement = null
        if (selector.type === 'class') {
            for (let i = 0; i < selector.data.length; i++) {
                let currentSelector = selector.data[i]
                observerElement = document.getElementsByClassName(currentSelector)[0]
                if (observerElement) {
                    break;
                }
            }
        } else if (selector.type === 'id') { // TODO if selector type is ID
            for (let i = 0; i < selector.data.length; i++) {
                let currentSelector = selector.data[i]
                observerElement = document.getElementById(currentSelector)
                if (observerElement) {
                    break;
                }
            }
        }
        let data = {
            observe: observerElement, lang: null,
        }

        return wp.hooks.applyFilters('tts_pro_granslate_selector', data)
    }


    #getCountryCode(selectedLang) {
        if (selectedLang.indexOf('-') != undefined) {
            return selectedLang.split('-')[0]
        }

        if (selectedLang.indexOf('_') != undefined) {
            return selectedLang.split('_')[0]
        }
        return selectedLang
    }
}

export default TTSGtranslate;