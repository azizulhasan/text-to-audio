class AtlasVoicePlayerInsights {
    data = {}
    insights = {}

    constructor(postId = '') {
        this.postId = postId
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/insights/' + this.postId; // Replace with your backend API URL
        this.getInsights()
    }

    // Helper function to get total count of events
    getTotalCount(eventType) {
        return this.data[eventType] ? this.data[eventType].count : 0;
    }

    // 1. Average click ratio on play button
    getAveragePlayClickRatio() {
        const initCount = this.getTotalCount('init');
        const playCount = this.getTotalCount('play');
        return initCount > 0 ? (playCount / initCount) * 100 : 0;
    }

    // 2. Average ratio of listening till end
    getAverageListenTillEndRatio() {
        const playCount = this.getTotalCount('play');
        const endCount = this.getTotalCount('end');
        return playCount > 0 ? (endCount / playCount) * 100 : 0;
    }

    // Additional functionalities

    // 3. Average listening time per play
    getAverageListeningTimePerPlay() {
        const playCount = this.getTotalCount('play');
        const totalTime = this.getTotalCount('time');
        return playCount > 0 ? totalTime / playCount : 0;
    }

    // 4. Total number of pauses
    getTotalPauses() {
        return this.getTotalCount('pause');
    }

    // 5. Average number of pauses per play
    getAveragePausesPerPlay() {
        const playCount = this.getTotalCount('play');
        const pauseCount = this.getTotalCount('pause');
        return playCount > 0 ? pauseCount / playCount : 0;
    }

    // Function to generate insights
    generateInsights() {
        return {
            averagePlayClickRatio: this.getAveragePlayClickRatio().toFixed(2) + '%',
            averageListenTillEndRatio: this.getAverageListenTillEndRatio().toFixed(2) + '%',
            averageListeningTimePerPlay: this.getAverageListeningTimePerPlay().toFixed(2) + ' seconds',
            totalPauses: this.getTotalPauses(),
            averagePausesPerPlay: this.getAveragePausesPerPlay().toFixed(2),
        };
    }

    async getInsights() {
        if (this.postId) {
            let response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-NONCE': window?.ttsObj?.rest_nonce,
                }
            });
            let data = await response.json();
            this.data = data.data;
            this.insights = this.generateInsights()

            console.log(this.insights)

        }

    }

    setInsights(data) {
        // Todo: validate insights.
        this.data = data;
    }
}

export default AtlasVoicePlayerInsights;

/**
 * Load AtlasVoicePlayerAnalytics after DOMContentLoaded if pro version exists.
 */
if (window?.ttsObj?.is_pro_active) {
    window.AtlasVoicePlayerAnalytics = AtlasVoicePlayerInsights;
}
if (window?.ttsObj?.is_admin_page) {
    let postId = getPostIdFromUrl(window.location.href)
    new AtlasVoicePlayerInsights(postId)
}

function getPostIdFromUrl(url) {
    try {
        // Create a URL object
        const urlObj = new URL(url);

        // Use URLSearchParams to get the value of the 'post' parameter
        const postId = urlObj.searchParams.get('post');

        return postId;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}
