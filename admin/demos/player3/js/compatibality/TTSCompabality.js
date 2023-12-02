import TTSGtranslate from "./plugins/TTSGtranslate";



class TTSCompatibality {

    #compatiblePlugins = {};
    initiatedPlugins = {};
    textToSpeechPro = null
    constructor(textToSpeechPro) {
        this.textToSpeechPro = textToSpeechPro
        this.#compatiblePlugins = {
            'gtranslate': 'TTSGtranslate'
        }
        this.#initPluginCompatibality()
    }

    #initPluginCompatibality() {
        /**
        * TODO build a basic structure of ttsObjPro.compatible on which
        * a loop will be initiate all compitable plugins.
        * and put all initiated plugins object to compatiblePlugins 
         * return it to TextToSpeechPro class plugins property.
         */
        if (ttsObjPro.compatible.hasOwnProperty('gtranslate/gtranslate.php')) {
            if (ttsObjPro.compatible['gtranslate/gtranslate.php'].type) {
                let gtranslate = new TTSGtranslate(this.textToSpeechPro);
                this.initiatedPlugins['gtranslate'] = gtranslate;
                this.initiatedPlugins.gtranslate.gtranslate(ttsObjPro.compatible['gtranslate/gtranslate.php'])
            }
        }


        return this.initiatedPlugins
    }
}

export default TTSCompatibality;