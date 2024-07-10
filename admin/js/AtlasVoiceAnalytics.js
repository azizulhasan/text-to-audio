import * as FingerprintJS from './analytics/fingerprint.js';

class AtlasVoiceAnalytics {
    constructor(postId = '') {
        this.userId = ttsObj.user_id;
        if (this.userId == '0') {
            this.getUniqueUserId();
        }
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/track'; // Replace with your backend API URL
        this.postId = postId
        this.sessionData = this.getSessionData();
        this._startTimeTracking = false;
        this.listeningLengthInterval = null;

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
        if (this.userId == '0') {
            this.getUniqueUserId();
        }
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
        if (!this.shouldTrackAnalyticsData()) {
            return;
        }

        if (Object.keys(this.sessionData)?.length === 0) return;
        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-NONCE': window?.ttsObj?.rest_nonce,
            },
            body: JSON.stringify({
                analytics: this.sessionData,
                post_id: this.postId,
                user_id: this.userId,
                other_data: {}
            }),
        });
        sessionStorage.removeItem('atlasVoice_analytics_data'); // Clear the session data after sending
        sessionStorage.removeItem('atlasVoice_analytics_is_initiated'); // Clear the session data after sending
    }

    async getUniqueUserId() {
        let userId = this.userId;
        if (this.userId == '0') {
            // Initialize the agent at application startup.
            // If you're using an ad blocker or Brave/Firefox, this import will not work.
            // Please use the NPM package instead: https://t.ly/ORyXk
            /**
             * chrome desktop logged in      :       c22574275fc8a2fb843ffbf953e1052c
             * Chrome dekstop incognito mode :       c22574275fc8a2fb843ffbf953e1052c
             * Firefox desktop not logged in :       fa5adde2cf549ab409591706ebb01c46
             * Edge desktop not logged in    :       de807730a48f78ab5fe12e68277b2c0d
             */
            let fpPromise = FingerprintJS.load()
            // Get the visitor identifier when you need it.

            await fpPromise.then(fp => fp.get())
                .then(result => {
                    // This is the visitor identifier:
                    userId = result.visitorId
                })
        }

        this.userId = userId

    }

    addEvent(eventType, data = {}) {
        if (!this.shouldTrackAnalyticsData()) {
            return;
        }
        let eventData = {}
        if (this.sessionData?.[eventType]) {
            let eventCount = this.sessionData?.[eventType]?.count;
            eventData = {
                count: eventCount + 1,
                timestamp: new Date().toISOString(),
                ...data,
            };
        } else {
            eventData = {
                count: 1,
                timestamp: new Date().toISOString(),
                ...data,
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
        if (!this.sessionData[this.postId]) {
            this.sessionData[this.postId] = {};
        }

        // Initialize event type data if not already set
        if (!this.sessionData[this.postId][eventType]) {
            this.sessionData[this.postId][eventType] = {count: 0};
        }

        // Increment the event count and merge any additional data
        this.sessionData[this.postId][eventType].count += 1;
        this.sessionData[this.postId][eventType] = {
            ...this.sessionData[this.postId][eventType],
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

    shouldTrackAnalyticsData() {
        let should_track = true;
        if (!window?.ttsObj?.settings?.analytics?.tts_enable_analytics) {
            return false;
        }
        if (window?.ttsObj?.settings?.analytics?.tts_trackable_post_ids?.length) {

            if ((window?.ttsObj.is_pro_active && window?.ttsObj?.settings?.analytics?.tts_trackable_post_ids.includes('all')) || window?.ttsObj.is_pro_active && window?.ttsObj?.settings?.analytics?.tts_trackable_post_ids.includes(this.postId)) {
                should_track = true;
            } else if (!window?.ttsObj?.settings?.analytics?.tts_trackable_post_ids.includes(this.postId)) {
                should_track = false;
            }
        }

        return should_track;
    }
}

export default AtlasVoiceAnalytics;

/**
 * Load AtlasVoiceAnalytics after DOMContentLoaded if pro version exists.
 */
if (window?.ttsObj?.is_pro_active) {
    window.AtlasVoiceAnalytics = AtlasVoiceAnalytics;
}