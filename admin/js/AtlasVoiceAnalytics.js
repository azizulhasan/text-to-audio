class AtlasVoiceAnalytics {
    constructor(postId = '') {
        this.userId = this.getUniqueUserId();
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/track'; // Replace with your backend API URL
        this.postID = postId
    }

    getUniqueUserId() {
        let userId = localStorage.getItem('tts_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tts_user_id', userId);
        }
        return userId;
    }

    sendEvent(eventType, data = {}) {
        const eventData = {
            eventType: eventType,
            data: {
                ...{
                    post_id: this.postID
                },
                ...data
            },
            nonce: window?.ttsObj?.rest_nonce,
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-NONCE': window?.ttsObj?.rest_nonce,
            },
            body: JSON.stringify(eventData),
        });
    }

    trackInit() {
        this.sendEvent('init');
    }

    trackPlay() {
        this.sendEvent('play');
    }

    trackPause() {
        this.sendEvent('pause');
    }

    trackResume() {
        this.sendEvent('resume');
    }

    trackEnd() {
        this.sendEvent('end');
    }

    trackListeningLength(length) {
        this.sendEvent('listening_length', {length: length});
    }

    captureDemographics() {
        // Use a service or API to get user demographics
        // For example, you can use the IPinfo API to get the user's location
        fetch('https://ipinfo.io/json?token=your_token')
            .then(response => response.json())
            .then(data => {
                this.sendEvent('demographics', data);
            });
    }

    captureDeviceInfo() {
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
        };
        this.sendEvent('device_info', deviceInfo);
    }

    getReport(period) {
        // Fetch aggregated data from the backend for the given period
        // Period can be 'all_time', '7_days', '15_days', '30_days', etc.
        return fetch(`${this.apiUrl}/report?period=${period}`)
            .then(response => response.json());
    }
}

// Usage
export default AtlasVoiceAnalytics;
// document.querySelector('.play-button').addEventListener('click', () => analytics.trackPlay(postId));
// document.querySelector('.resume-button').addEventListener('click', () => analytics.trackResume(postId));
// document.querySelector('.replay-button').addEventListener('click', () => analytics.trackReplay(postId));
// document.querySelector('.download-button').addEventListener('click', () => analytics.trackDownload(postId));
// analytics.captureDemographics();
// analytics.captureDeviceInfo();
