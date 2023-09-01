
export default function UpgradeToPro({ }) {
    return <>
        {
            window.hasOwnProperty('ttsObj') && !ttsObj.is_pro_license_active ? <div className="card p-0">
                <div className="card-header bg-primary text-center text-white">
                    Upgrade to Pro
                </div>
                <div className="card-body">
                    <u className="list-group text-left">
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
                    </u>
                    <a target='_blank' href="https://atlasaidev.com/" className="tta_btn btn-center text-center">Upgrade</a>
                </div>
            </div> : null
        }
    </>

}