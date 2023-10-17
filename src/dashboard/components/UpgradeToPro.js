
export default function UpgradeToPro({ }) {
    return <>
        {
            window.hasOwnProperty('ttsObj') && !ttsObj.is_pro_license_active ? <div className="card p-0">
                <div className="card-header text-center tta_btn btn-center">
                    <a target='_blank' href="https://atlasaidev.com/text-to-speech-pro/" className="tta_btn btn-center text-center">Upgrade To Pro</a>
                </div>
                <div className="card-body">
                    <u className="list-group text-left">
                        <li className="list-group-item">
                            Get Live Support for firts time Integration
                        </li>
                        <li className="list-group-item">
                            Get Priority Support
                        </li>
                        <li className="list-group-item">
                            30 Days money back.
                        </li>
                        <li className="list-group-item">
                            <a target='_blank' href="https://wordpress.org/plugins/gtranslate/">Translate WordPress with GTranslate Plugin Support</a>
                        </li>
                        <li className="list-group-item">
                            Improved UI and Responsive of the button
                        </li>
                        <li className="list-group-item">
                            Remove special characters, URL, ShortCodes from content during reading
                        </li>
                        <li className="list-group-item">
                            Integrate with Google Cloud Text To Speech
                        </li>
                        <li className="list-group-item">
                            Get more than 600 voices when you’re using Google Cloud Text To Speech.
                        </li>
                        <li className="list-group-item" >
                            Download the audio file for offline when Integrate with Google TTS
                        </li>
                        <li className="list-group-item" >
                            <a target="_blank" href="https://wpml.org/"> WPML Support ( comming soon )</a>
                        </li>
                    </u>
                    <a target='_blank' href="https://atlasaidev.com/text-to-speech-pro/" className="tta_btn btn-center text-center">Upgrade</a>
                </div>
            </div> : null
        }
    </>

}