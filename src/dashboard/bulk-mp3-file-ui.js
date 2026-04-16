import ReactDOM from "react-dom";
import GenerateBulkMp3File from "./bulk-mp3-file/generate-bulk-mp3-file";
/**
 * Get customize settings.
 */

let app = document.getElementById("atlasvoice_generate_bulk_mp3_file")
ReactDOM.render(
    <React.StrictMode>
        <GenerateBulkMp3File/>
    </React.StrictMode>,
    app
);