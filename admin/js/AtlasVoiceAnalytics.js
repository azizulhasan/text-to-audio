class AtlasVoiceAnalytics {
    constructor(postId = '') {
        this.userId = this.getUniqueUserId();
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/track'; // Replace with your backend API URL
        this.postID = postId
        this.sessionData = this.getSessionData();
        this._startTimeTracking = false;
        this.listeningLengthInterval = null;
        this.listeningLength = 0;

        // Bind the event listeners for beforeunload and unload
        window.addEventListener('beforeunload', this.sendSessionData.bind(this));

    }


    get startTimeTracking() {
        return this._startTimeTracking;
    }

    set startTimeTracking(value) {
        this._startTimeTracking = value;
        this.trackListeningLength();
    }

    handleStartTimeTracking(value) {
        this.trackListeningLength()
    }

    trackInit() {
        this.addEvent('init');
    }

    trackPlay() {
        this.startTimeTracking = true;
        this.addEvent('play');
    }

    trackPause() {
        this.startTimeTracking = false;
        this.addEvent('pause');
    }

    trackResume() {
        this.startTimeTracking = true;
        this.addEvent('resume');
    }

    trackEnd() {
        this.startTimeTracking = false;
        this.addEvent('end');
    }

    trackListeningLength() {
        if (this.startTimeTracking) {
            if (!this.listeningLengthInterval) {
                this.listeningLengthInterval = setInterval(() => {

                    let sessionData = this.getSessionData();
                    if (sessionData?.listening_length) {
                        this.listeningLength = sessionData?.listening_length?.length
                    }

                    this.listeningLength += 1; // Default tracking interval of 5 seconds
                    this.addEvent('time');
                }, 1000);
            }
        } else {
            clearInterval(this.listeningLengthInterval);
            this.listeningLengthInterval = null;
            // Add the total listening length to session data when tracking stops
            this.addEvent('time');
            this.listeningLength = 0; // Reset the listening length for the next session
        }
    }


    getSessionData() {
        const sessionData = sessionStorage.getItem('atlasVoice_analytics_data');
        return sessionData ? JSON.parse(sessionData) : {};
    }

    saveSessionData() {
        sessionStorage.setItem('atlasVoice_analytics_data', JSON.stringify(this.sessionData));
    }

    sendSessionData() {
        if (Object.keys(this.sessionData)?.length === 0) return;
        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-NONCE': window?.ttsObj?.rest_nonce,
            },
            body: JSON.stringify({
                analytics: this.sessionData,
                post_id: this.postID
            }),
        });
        sessionStorage.removeItem('atlasVoice_analytics_data'); // Clear the session data after sending
    }

    getUniqueUserId() {
        let userId = localStorage.getItem('tts_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tts_user_id', userId);
        }
        return userId;
    }

    addEvent(eventType, data = {}) {
        let eventData = {}
        if (this.sessionData?.[eventType]) {
            let eventCount = this.sessionData?.[eventType]?.count;
            eventData = {
                count: eventCount + 1,
                ...data
            };
        } else {
            eventData = {
                count: 1,
                ...data
            };
        }

        this.sessionData[eventType] = eventData;
        this.saveSessionData();

    }

    /**
     * if multiple post data should be track
     * @param eventType
     * @param data
     */
    addEvent_new(eventType, data = {}) {
        // Initialize post data if not already set
        if (!this.sessionData[this.postID]) {
            this.sessionData[this.postID] = {};
        }

        // Initialize event type data if not already set
        if (!this.sessionData[this.postID][eventType]) {
            this.sessionData[this.postID][eventType] = { count: 0 };
        }

        // Increment the event count and merge any additional data
        this.sessionData[this.postID][eventType].count += 1;
        this.sessionData[this.postID][eventType] = {
            ...this.sessionData[this.postID][eventType],
            ...data,
        };

        // Save session data
        this.saveSessionData();
    }


    captureDemographics() {
        // Use a service or API to get user demographics
        // For example, you can use the IPinfo API to get the user's location
        fetch('https://ipinfo.io/json?token=your_token')
            .then(response => response.json())
            .then(data => {
                this.addEvent('demographics', data);
            });
    }

    captureDeviceInfo() {
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
        };
        this.addEvent('device_info', deviceInfo);
    }

    getReport(period) {
        // Fetch aggregated data from the backend for the given period
        // Period can be 'all_time', '7_days', '15_days', '30_days', etc.
        return fetch(`${this.apiUrl}/report?period=${period}`)
            .then(response => response.json());
    }
}

export default AtlasVoiceAnalytics;

/**
 * Load text to speech after DOMContentLoaded in free version.
 */
if (window?.ttsObj?.is_pro_active) {
    window.AtlasVoiceAnalytics = AtlasVoiceAnalytics;
}