import { Button } from "react-bootstrap"




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
        let demo_file = '/admin/demos/player3/demo.mp3';
        if(this.buttonId == 4) {
            demo_file = '/admin/demos/player3/demo4.mp3';
        }
        this.#setUpPlayer(ttsObj.plugin_url + demo_file)
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
        this.title = this.title + "__lang=" + ttsObj.listening.tta__listening_lang;
        this.title = this.title + "__voice=" + ttsObj.listening.tta__listening_voice;
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
                speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75] }
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