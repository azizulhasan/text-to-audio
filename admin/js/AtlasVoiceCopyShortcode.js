document.getElementById('tta_play_btn_shortcode_copy_button')?.addEventListener('click', copyshortcode);


function unsecuredCopyToClipboard()  {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy')
        alert('Copied')
    } catch (err) {
        console.error('Unable to copy to clipboard', err)
    }

    document.body.removeChild(textArea)
};

/**
 * Copy short Code
 */
function copyshortcode() {
    /* Get the text field */
    var copyText = document.getElementById("tta_play_btn_shortcode");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    if (window.isSecureContext && navigator.clipboard) {
        /* Copy the text inside the text field */
        navigator.clipboard
            .writeText(copyText.value)
            .then(() => {
                alert('Copied')
            })
            .catch((e) => {
                alert("Something went wrong! " + e);
                // toast('Something went wrong! ');
            });
    } else {
        unsecuredCopyToClipboard(copyText.value);
    }
};