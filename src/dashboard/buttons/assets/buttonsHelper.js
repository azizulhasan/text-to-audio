export const shouldCallPositionFunction = (button) => {
    if (button && typeof button?.getBoundingClientRect === "function") {
        return true;
    }

    return false;
}

export  const detectScroll = (e, button) => {
    // let button = document.getElementById('player_content_' + buttonId);

    let postTitle = null;
    let titlePosition = 0;
    if (document.querySelector('.post-title')) {
        postTitle = document.querySelector('.post-title')
        if (shouldCallPositionFunction(postTitle)) {
            titlePosition = postTitle.getBoundingClientRect().top;
        }
    } else if (document.querySelector('.entry-title')) {
        postTitle = document.querySelector('.entry-title')
        if (shouldCallPositionFunction(postTitle)) {
            titlePosition = postTitle.getBoundingClientRect().top;
        }
    } else if (document.querySelector('.wp-block-post-title')) {
        postTitle = document.querySelector('.wp-block-post-title')
        if (shouldCallPositionFunction(postTitle)) {
            titlePosition = postTitle.getBoundingClientRect().top;
        }
    }
    let shouldFloat = false;
    if (button) {
        if (shouldCallPositionFunction(button)) {
            let topPos = Math.floor(button.getBoundingClientRect().top);
            if (topPos < 1) {
                shouldFloat = true;
            }
        }

        if (titlePosition > 0) {
            shouldFloat = false;
        }
    }

    return shouldFloat;
}