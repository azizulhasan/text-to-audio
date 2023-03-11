import("https://storage.googleapis.com/speechify-api-cdn/speechifyapi.min.mjs").then(async (speechifyWidget) => {
    // this parent element for your article or listenable content
    const articleRootElement = document.getElementById("speechify-content");

    const widget = speechifyWidget.makeSpeechifyExperience({
        rootElement: articleRootElement,
        useSpeechifyRoot: true
    });
    await widget.mount();
});

