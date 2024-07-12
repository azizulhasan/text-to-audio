
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
                            Get Live Support for first time Integration.
                        </li>
                        <li className="list-group-item">
                            51 languages support in pro version.
                        </li>
                        <li className="list-group-item">
                            Advance Analytics.
                        </li>
                        <li className="list-group-item">
                            <a target="_blank" href="https://atlasaidev.com/refund-policy/"> 14 Days money back
                                guarantee.</a>
                        </li>
                        <li className="list-group-item">
                            <a target="_blank" href="https://wpml.org/"> WPML Plugin Support</a>
                        </li>
                        <li className="list-group-item">
                            <a target='_blank' href="https://wordpress.org/plugins/gtranslate/">GTranslate Plugin
                                Support</a>
                        </li>
                        <li className="list-group-item">
                            <a target='_blank'
                               href="https://www.youtube.com/watch?v=4dsbhaBavms&t=43s&ab_channel=AtlasAiDev">You Can
                                Integrate
                                With Google Cloud Text To Speech.</a>
                        </li>
                        <li className="list-group-item">
                            Get more than 200 voices with Google Cloud Text To Speech.
                        </li>
                        <li className="list-group-item">
                            Download the audio file for offline listening.
                        </li>
                        <li className="list-group-item">
                            Improved UI and Responsive of the button
                        </li>
                        <li className="list-group-item">
                            Multiple Audio Player Support.
                        </li>
                        <li className="list-group-item">
                            Include Content By CSS Selectors
                        </li>
                        <li className="list-group-item">
                            Exclude Content By CSS Selectors
                        </li>
                        <li className="list-group-item">
                            Exclude HTML Tags To Speak
                        </li>
                        <li className="list-group-item">
                            Exclude Texts To Speak
                        </li>
                        <li className="list-group-item">
                            Exclude Tags To Speak
                        </li>
                        <li className="list-group-item">
                            Exclude Categories To Speak
                        </li>
                    </u>
                    <a target='_blank' href="https://atlasaidev.com/text-to-speech-pro/"
                       className="tta_btn btn-center text-center">Upgrade</a>
                </div>
            </div> : null
        }
    </>

}