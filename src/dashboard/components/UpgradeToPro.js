
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
                            Get Live Support for firts time Integration.
                        </li>
                        <li className="list-group-item">
                            51 languages support in pro version.
                        </li>
                        <li className="list-group-item">
                            14 Days money back.
                        </li>
                        <li className="list-group-item" >
                            <a target="_blank" href="https://wpml.org/"> WPML Plugin Support</a>
                        </li>
                        <li className="list-group-item">
                            <a target='_blank' href="https://wordpress.org/plugins/gtranslate/">GTranslate Plugin Support</a>
                        </li>
                        <li className="list-group-item" >
                            Download the audio file for offline listening.
                        </li>
                        <li className="list-group-item">
                            Improved UI and Responsive of the button
                        </li>
                        <li className="list-group-item">
                            Remove special characters, URL, ShortCodes from content during reading.
                        </li>
                    </u>
                    <a target='_blank' href="https://atlasaidev.com/text-to-speech-pro/" className="tta_btn btn-center text-center">Upgrade</a>
                </div>
            </div> : null
        }
    </>

}