import ReactDOM from "react-dom";
import CSSSelectorsForPosts from "./css-selectors/CSSSelectorsForPosts";

/**
 * Get customize settings.
 */

let app = document.getElementById("tts-css-selectors")
if(app) {
    ReactDOM.render(
        <React.StrictMode>
            <CSSSelectorsForPosts/>
        </React.StrictMode>,
        app
    );
}
