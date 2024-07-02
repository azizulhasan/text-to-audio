
export default class TTSAnalytics {
    constructor() {
        this.userId = this.getUniqueUserId();
        this.apiUrl = 'https://your-backend-api.com/analytics'; // Replace with your backend API URL
    }

    getUniqueUserId() {
        let userId = localStorage.getItem('tts_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tts_user_id', userId);
        }
        return userId;
    }

    sendEvent(eventType, data) {
        const eventData = {
            userId: this.userId,
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString(),
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });
    }

    trackPlay(postId) {
        this.sendEvent('play', { postId: postId });
    }

    trackResume(postId) {
        this.sendEvent('resume', { postId: postId });
    }

    trackReplay(postId) {
        this.sendEvent('replay', { postId: postId });
    }

    trackDownload(postId) {
        this.sendEvent('download', { postId: postId });
    }

    trackListeningLength(postId, length) {
        this.sendEvent('listening_length', { postId: postId, length: length });
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
const analytics = new TTSAnalytics();
document.querySelector('.play-button').addEventListener('click', () => analytics.trackPlay(postId));
document.querySelector('.resume-button').addEventListener('click', () => analytics.trackResume(postId));
document.querySelector('.replay-button').addEventListener('click', () => analytics.trackReplay(postId));
document.querySelector('.download-button').addEventListener('click', () => analytics.trackDownload(postId));
analytics.captureDemographics();
analytics.captureDeviceInfo();
