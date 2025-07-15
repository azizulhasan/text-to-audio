export default class BrowserSupport {
    #browser = ''
    #ttsObj = {}
    voices = []
    #voice = 'Microsoft Zira - English (United States)'
    #lang = 'en-US'
    #selectedLang = 'en-US'
    #selectedVoice = 'Microsoft Zira - English (United States)'
    #filteredVoices = [];
    constructor(ttsObj, voices, selectedLang, selectedVoice) {
        this.#ttsObj = ttsObj
        this.voices = voices
        if (selectedLang) {
            this.#selectedLang = selectedLang
        }
        if (selectedVoice) {
            this.#selectedVoice = selectedVoice
        }

        this.defineVoiceAndLang(selectedVoice, selectedLang)
    }
    isAndroid() {
        let ua = navigator.userAgent.toLowerCase();

        let isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
        if (isAndroid) {
            return true;
        }
        return false
    }


    getLanguage(selectedVoice = this.#voice, selectedLang = this.#lang) {
        if (this.#lang === selectedLang) {
            return this.#lang;
        }
        this.defineVoiceAndLang(selectedVoice, selectedLang)

        return this.#lang;
    }

    getVoice(selectedVoice = this.#voice, selectedLang = this.#lang) {
        if (this.#voice === selectedVoice) {
            return this.#voice;
        }

        this.defineVoiceAndLang(selectedVoice, selectedLang)


        return this.#voice;
    }

    setLanguage(lang, callback) {
        let isSupported = false;
        if (this.voices.length) {
            Object.values(this.voices).map(voice => {
                let regex = new RegExp(lang, "gi");
                let matches = voice.lang.match(regex)
                if (matches !== null && voice.name) {
                    this.#lang = voice.lang;
                    isSupported = true;
                }
            })
            return { lang: this.#lang, isSupported };
        }


        return { lang: this.#lang, isSupported };



    }

    setVoice(voice) {
        this.#voice = voice;
    }

    getVoiceByLangCode(lang) {
        for (let i = 0; i < this.voices.length; i++) {
            let voice = this.voices[i]
            if (voice.lang === lang) {
                return voice.name;
                break;
            }
        }

        return false;
    }

    /**
     * 
     */
    defineVoiceAndLang(voice, lang) {
        let currentVoice, currentLang = '';
        let selectedVoice = voice ? voice : this.#selectedVoice
        let selectedLang = lang ? lang : this.#selectedLang
        let langCountryCode = this.#getCountryCode(selectedLang)
        let filteredVoices = this.#getFilteredVoices(langCountryCode)
        if (filteredVoices.length > 1) {
            for (let j = 0; j < filteredVoices.length; j++) {
                currentLang = filteredVoices[j].lang
                currentVoice = filteredVoices[j].name
                if (selectedVoice === filteredVoices[j].name) {
                    this.#voice = currentVoice;
                    this.#lang = currentLang;
                    break;
                } else {
                    this.#voice = currentVoice;
                    this.#lang = currentLang;
                }
            }
        } else if (filteredVoices.length === 1) {
            this.#voice = filteredVoices[0].name;
            this.#lang = filteredVoices[0].lang
        } else {
            this.#voice = voice;
            this.#lang = lang
        }
    }

    /**
     * 
     * @param {*} selectedLang 
     * @returns 
     */
    #getCountryCode(selectedLang) {
        if (selectedLang && selectedLang.indexOf('-') != undefined) {
            return selectedLang.split('-')[0]
        }

        if (selectedLang && selectedLang.indexOf('_') != undefined) {
            return selectedLang.split('_')[0]
        }


        return selectedLang
    }

    /**
     * 
     * @param {*} currentLang 
     * @returns 
     */
    #getFilteredVoices(langCountryCode) {
        this.#filteredVoices = [];

        Object.values(this.voices).map(voice => {
            let regex = new RegExp(langCountryCode, "gi");
            let matches = voice.lang.match(regex)
            if (matches !== null && voice.name) {
                this.#filteredVoices.push(voice)
            }
        })

        return this.#filteredVoices;
    }


    getVoices() {
        return this.voices;
    }

    validateCountryCode(countryCode) {
        let voices = this.voices;
        for (let j = 0; j < voices.length; j++) {
            let currentCountryCode = voices[j].lang
            currentCountryCode = this.#getCountryCode(currentCountryCode)
            if (currentCountryCode == countryCode || this.aliasCountryCode(countryCode)) {
                return true;
            }
        }
        return false;
    }

    aliasCountryCode(currentCountryCode, returnTypeIsValidOrCountryCode = true) {
        let aliasCountryCodes = {
            es: ['es', 'ca']
        }

        for (let alias in aliasCountryCodes) {
            if (aliasCountryCodes[alias].includes(currentCountryCode)) {
                return returnTypeIsValidOrCountryCode ? true : alias;
            }
        }

        return returnTypeIsValidOrCountryCode ? false : currentCountryCode;

    }
}

window.BrowserSupport = BrowserSupport;