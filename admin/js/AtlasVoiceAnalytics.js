import * as FingerprintJS from './analytics/fingerprint.js';
import {getUserAddress} from "./tts/utilities";

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

        // Progress milestone tracking
        this._audioDuration = 0;
        this._currentTime = 0;
        this._milestones = {
            '25_percent': false,
            '50_percent': false,
            '75_percent': false
        };

        // Bind the event listeners for beforeunload and unload
        window.addEventListener('beforeunload', this.sendSessionData.bind(this));

        this.trackDeviceInfo()
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
        // Reset milestones for next play
        this.resetMilestones();
    }

    /**
     * Set the total duration of the audio
     * @param {number} duration - Duration in seconds
     */
    setAudioDuration(duration) {
        this._audioDuration = duration;
    }

    /**
     * Track progress and fire milestone events at 25%, 50%, 75%
     * @param {number} currentTime - Current playback time in seconds
     */
    trackProgress(currentTime) {
        if (!this._audioDuration || this._audioDuration <= 0) return;

        this._currentTime = currentTime;
        const progressPercent = (currentTime / this._audioDuration) * 100;

        // Track 25% milestone
        if (progressPercent >= 25 && !this._milestones['25_percent']) {
            this._milestones['25_percent'] = true;
            this.addEvent('25_percent');
        }

        // Track 50% milestone
        if (progressPercent >= 50 && !this._milestones['50_percent']) {
            this._milestones['50_percent'] = true;
            this.addEvent('50_percent');
        }

        // Track 75% milestone
        if (progressPercent >= 75 && !this._milestones['75_percent']) {
            this._milestones['75_percent'] = true;
            this.addEvent('75_percent');
        }
    }

    /**
     * Reset milestones for a new playback session
     */
    resetMilestones() {
        this._milestones = {
            '25_percent': false,
            '50_percent': false,
            '75_percent': false
        };
    }

    /**
     * Track download event
     */
    trackDownload() {
        this.addEvent('download');
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
            if(this.startTimeTracking) {
                this.addEvent('time');
            }
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

    sendSessionData_old() {
        if (!this.shouldTrackAnalyticsData()) {
            return;
        }

        this.sessionData = this.getSessionData()

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
        window.hasAtlasVoiceAnalyticsBeforeUnloadListener = false;
    }

    sendSessionData() {
        if (!this.shouldTrackAnalyticsData()) return;

        const sessionData = this.getSessionData();
        if (Object.keys(sessionData).length === 0) return;

        const payload = {
            analytics: sessionData,
            post_id: this.postId,
            user_id: this.userId,
            other_data: {},
            rest_nonce: window?.ttsObj?.rest_nonce
        };

        // Convert to JSON once
        const jsonData = JSON.stringify(payload);

        // --- Browser Detection ---
        const userAgent = navigator.userAgent.toLowerCase();
        const isFirefox = userAgent.includes('firefox');
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // --- 1️⃣ Use sendBeacon for Firefox/Safari ---
        if (navigator.sendBeacon && (isFirefox || isSafari)) {
            try {
                const blob = new Blob([jsonData], { type: 'application/json' });
                const success = navigator.sendBeacon(this.apiUrl, blob);

                if (success) {
                    sessionStorage.removeItem('atlasVoice_analytics_data');
                    sessionStorage.removeItem('atlasVoice_analytics_is_initiated');
                }
            } catch (e) {
                console.warn('sendBeacon failed, fallback to fetch()', e);
                this._sendSessionDataWithFetch(jsonData); // fallback
            }
        }

        // --- 2️⃣ Use normal fetch for Chrome / Edge / others ---
        else {
            this._sendSessionDataWithFetch(jsonData);
        }

        window.hasAtlasVoiceAnalyticsBeforeUnloadListener = false;
    }

// ✅ Helper: Fallback fetch sender
    _sendSessionDataWithFetch(jsonData) {
        fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-NONCE': window?.ttsObj?.rest_nonce || ''
            },
            body: jsonData,
            keepalive: true // 👈 ensures fetch tries to finish even during unload
        }).catch(err => console.error('Fetch error:', err))
            .finally(() => {
                sessionStorage.removeItem('atlasVoice_analytics_data');
                sessionStorage.removeItem('atlasVoice_analytics_is_initiated');
            });
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

        if(eventType === 'device_info') {
            this.sessionData[eventType] = data;
            this.saveSessionData();
            return;
        }
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



    async trackDeviceInfo() {
        const deviceInfo = await this.getDeviceData().then(info => info);
        this.addEvent('device_info', deviceInfo);
    }

    /**
     * getDeviceData()
     * Collects only information that does NOT require explicit user consent,
     * and will collect geolocation ONLY if permission is already granted (no prompt).
     *
     * Returns: Promise resolving to an object with discovered properties.
     *
     * NOTE: It's impossible to read a user's "device name" (e.g., "John's iPhone")
     * from standard browser APIs — browsers do not expose that for privacy reasons.
     * This function infers device/OS/browser from available hints (userAgent / userAgentData).
     *
     * Usage:
     *   getDeviceData().then(data => console.log(data));
     */
    async  getDeviceData() {

        const result = {
            // user agent / hints
            browserName: null,
            browserVersion: null,
            browser: null,

            // platform / OS / device type
            platform: navigator.platform || null,
            deviceType: null, // 'mobile' | 'tablet' | 'desktop' | 'unknown'
            architecture: null,

            // language / timezone
            language: navigator.language || null,
            timeZone: this.#getTimeZone(),

            // location (only if permission already granted; will NOT prompt)
            location: null, // {latitude, longitude, accuracy, timestamp} or null

            country: this.#country(),
        };



        // Parse a best-effort browser name & version from userAgent or userAgentData
        (function parseBrowser() {
            // Prefer userAgentData.brands if available
            // if (result.userAgentData && Array.isArray(result.userAgentData.brands) && result.userAgentData.brands.length) {
            //     // take the highest-ranking brand (best-effort)
            //     const brand = result.userAgentData.brands[result.userAgentData.brands.length - 1];
            //     if (brand) {
            //         result.browserName = brand.brand || null;
            //         result.browserVersion = brand.version || null;
            //     }
            // }

            // Fallback: simple regex-based UA parsing (best-effort; not perfect)
            if (!result.browserName ) {
                const ua = window?.navigator?.userAgent;
                const browsers = [
                    { name: 'Edge', re: /Edg\/([0-9._]+)/ },
                    { name: 'Chrome', re: /Chrome\/([0-9._]+)/ },
                    { name: 'Firefox', re: /Firefox\/([0-9._]+)/ },
                    { name: 'Safari', re: /Version\/([0-9._]+).*Safari/ },
                    { name: 'Opera', re: /OPR\/([0-9._]+)/ },
                    { name: 'IE', re: /MSIE\s([0-9._]+)|Trident\/.*rv:([0-9._]+)/ }
                ];
                for (const b of browsers) {
                    const m = ua.match(b.re);
                    if (m) {
                        result.browser = b.name + '_' + m[1] || m[2] || null;
                        break;
                    }
                }
            }
        })();


        // Geolocation: ONLY read if permission is already granted (do not prompt)
        async function tryGetLocationIfAlreadyGranted() {
            if (!('permissions' in navigator) || !('geolocation' in navigator)) {
                return null;
            }

            try {
                // Some browsers may not support query({name:'geolocation'}) — wrap in try/catch
                const status = await navigator.permissions.query({ name: 'geolocation' });
                if (status && status.state === 'granted') {
                    // Safe to call getCurrentPosition — it will not prompt
                    return new Promise((resolve) => {
                        // set a reasonable short timeout in case of issues
                        const options = { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 5000 };
                        navigator.geolocation.getCurrentPosition(
                            pos => {
                                resolve({
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude,
                                    accuracy: pos.coords.accuracy,
                                    timestamp: pos.timestamp
                                });
                            },
                            err => {
                                // If for some reason it fails, return null (but do NOT prompt)
                                resolve(null);
                            },
                            options
                        );
                    });
                } else {
                    // permission not granted — do not prompt
                    return null;
                }
            } catch (e) {
                // Permissions API not available or blocked — do nothing
                return null;
            }
        }

        try {
            const location = await tryGetLocationIfAlreadyGranted();
            if (location) result.location = location;
        } catch (e) {
            // ignore
        }


        function deviceOSInfo(userAgent = navigator.userAgent) {
            userAgent = userAgent.toLowerCase();

            let platform = 'Unknown';
            let deviceType = 'Desktop'; // default
            let architecture = '';

            // ===== WINDOWS =====
            if (userAgent.includes('windows')) {
                if (userAgent.includes('windows nt 10.0')) platform = 'Windows 10';
                else if (userAgent.includes('windows nt 11.0')) platform = 'Windows 11';
                else if (userAgent.includes('windows nt 6.3')) platform = 'Windows 8.1';
                else if (userAgent.includes('windows nt 6.2')) platform = 'Windows 8';
                else if (userAgent.includes('windows nt 6.1')) platform = 'Windows 7';
                else platform = 'Windows';

                if (userAgent.includes('win64') || userAgent.includes('x64') || userAgent.includes('wow64')) {
                    architecture = '64-bit';
                } else if (userAgent.includes('win32') || userAgent.includes('x86')) {
                    architecture = '32-bit';
                }
            }

            // ===== MAC / iOS =====
            else if (userAgent.includes('macintosh') || userAgent.includes('mac os')) {
                platform = 'macOS';
                if (userAgent.includes('arm') || userAgent.includes('apple')) {
                    architecture = 'Apple Silicon';
                } else {
                    architecture = 'Intel';
                }
            } else if (/iphone|ipad|ipod/.test(userAgent)) {
                platform = 'iOS';
                deviceType = /ipad/.test(userAgent) ? 'Tablet' : 'Mobile';
            }

            // ===== ANDROID =====
            else if (userAgent.includes('android')) {
                const versionMatch = userAgent.match(/android\s([\d\.]+)/);
                platform = versionMatch ? `Android ${versionMatch[1]}` : 'Android';
                deviceType = userAgent.includes('mobile') ? 'Mobile' : 'Tablet';
            }

            // ===== LINUX =====
            else if (userAgent.includes('linux')) {
                platform = 'Linux';
                if (userAgent.includes('x86_64')) architecture = '64-bit';
                else if (userAgent.includes('i686')) architecture = '32-bit';
            }

            // ===== Detect device type generally =====
            if (/mobi|android|iphone|ipod/i.test(userAgent)) {
                deviceType = 'Mobile';
            } else if (/ipad|tablet/i.test(userAgent)) {
                deviceType = 'Tablet';
            }

            // ===== Return clean structured data =====
            return {
                platform,        // e.g. "Windows 10"
                architecture,    // e.g. "64-bit"
                deviceType,      // e.g. "Desktop"
            };
        }
        const osIfo = deviceOSInfo()
        if(osIfo?.deviceType) {
            result.deviceType = osIfo.deviceType
        }

        if(osIfo?.platform) {
            result.platform = osIfo.platform
        }
        if(osIfo?.architecture) {
            result.architecture = osIfo.architecture
        }


        return result;
    }

    #getTimeZone() {
        return (typeof Intl === 'object' && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    }
    #country(){
        const timeZone = this.#getTimeZone();
        const tzData = ct.getTimezone(timeZone);
        const countryData = tzData ? ct.getCountry(tzData.countries[0]) : null;

        return countryData ? countryData.name : 'Unknown';
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
window.AtlasVoiceAnalytics = AtlasVoiceAnalytics;
