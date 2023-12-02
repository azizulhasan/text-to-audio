async function fetchData(payload) {
    let url = this.getUrl(payload.endpoint);
    let config = payload.config || {}
    config = {
        ...config, ...{
            headers: {
                "X-WP-Nonce": ttsObj.rest_nonce
            }
        }
    }
    const data = await fetch(url, config);
    return await data.json();
}

function getUrl(endpoint) {
    let url = ttsObj.json_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/';
    if (endpoint) {
        url += endpoint;
    }

    return url;
}



let players = [...document.querySelectorAll('.player_content')]
/**
 * Define TextToSpeechPro class .
 */
class TextToSpeechProPlayer {
    buttonId
    title = ''
    contents = ''
    path = ''
    constructor(buttonId, content = '', button = null, TTS = window.TTS) {
        this.buttonId = buttonId
        this.#setTitle(TTS)
        this.#setPath(TTS)
        this.content = content
        // TODO: Set demo player 3
        this.#setUpPlayer(ttsObj.plugin_url + '/admin/demos/player3/Hello_world!__lang=en_AU__voice=Microsoft_Mark___English_(United_States).mp3')
    }

    #declare_init_content() {
        let tts_data = {
            listening: {
                tta__listening_lang: "en-US",
                tta__listening_voice: "Microsoft David - English (United States)",
                tta__listening_pitch: "1",
                tta__listening_rate: "1",
                tta__listening_volume: "1"
            },
            cssClass: "",
            btnStyle: "background-color:#ee6d6d;color:#ffffff;width:100%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;",
            textArr: {
                listen_text: "Listen",
                pause_text: "Pause",
                resume_text: "Resume",
                replay_text: "Replay",
                start_text: "Start",
                stop_text: "Start"
            },
            customCSS: "",
            shouldDisplayIcon: "inline-block"
        }

        var ttsCurrentButtonNo = 1;
        var ttsCurrentContent = 'test data data';
        var ttsListening = tts_data.listening;
        var ttsCSSClass = tts_data.cssClass;
        var ttsBtnStyle = tts_data.btnStyle;
        var ttsTextArr = tts_data.textArr;
        var ttsCustomCSS = tts_data.customCSS;
        var ttsShouldDisplayIcon = tts_data.shouldDisplayIcon;
        var ttsSettings = {
            listening: ttsListening,
            cssClass: ttsCSSClass,
            btnStyle: ttsBtnStyle,
            textArr: ttsTextArr,
            customCSS: ttsCustomCSS,
            shouldDisplayIcon: ttsShouldDisplayIcon
        };


        if (window.hasOwnProperty('TTS')) { // add content if a page have multiple button
            var prevContent = window.TTS.contents[ttsCurrentButtonNo - 1]
            if (prevContent !== ttsCurrentContent) { // don't repeat same content
                window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
            }

        } else { // add content for the if a page have one button
            window.TTS = {}
            window.TTS.contents = {}
            window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
        }

        // add settings
        if (!window.TTS.hasOwnProperty('settings')) {
            window.TTS.settings = ttsSettings
        }
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
        // this.title = this.title.replaceAll(/[^a-zA-Z ]/g, "");
        this.title = this.title.split(' ').join('_');
        this.title = this.title + "__lang=" + tts.settings.listening.tta__listening_lang;
        this.title = this.title + "__voice=" + tts.settings.listening.tta__listening_voice;
        this.title = this.title.replaceAll(' ', '_');
        this.title = this.title.replaceAll('-', '_');
    }

    #setUpPlayer(url, should_replace = false) {

        var supportsAudio = !!document.createElement('audio').canPlayType;
        console.log(url)

        if (supportsAudio) {
            let playerHTML = document.createElement('audio');
            if (should_replace) {
                // console.log(should_replace)
                let player = document.getElementById('player_content_' + this.buttonId);
                let playerChildren = player.childNodes;
                playerChildren[0].remove()
            }
            playerHTML.setAttribute('id', 'player_' + this.buttonId)

            let source = document.createElement('source')
            source.setAttribute("type", "audio/mp3")
            playerHTML.append(source);

            playerHTML.children[0].setAttribute('src', url)

            document.getElementById('player_content_' + this.buttonId).append(playerHTML)
            let player = new Plyr(document.getElementById('player_' + this.buttonId), {
                controls: [
                    // 'restart',
                    'play',
                    'progress',
                    'current-time',
                    // 'duration',
                    'mute',
                    'volume',
                    'download',
                    'settings'
                ],
            });
            player.on('play', function (e) {
                // console.log(e)
            })
            player.on('pause', function (e) {
                // console.log(e)
            })
            player.on('restart', function (e) {
                // console.log('restart')
            })

            player.on('progress', function (e) {
                // console.log('progress')
            })
            player.on('volumechange', function (e) {
                // console.log('volumechange')
            })
            player.on('ended', function (e) {
                // console.log('ended')
            })

            player.on('ratechange', function () {
                // console.log('ratechange')
            })
        }
    }

}
window.TextToSpeechProPlayer = TextToSpeechProPlayer
