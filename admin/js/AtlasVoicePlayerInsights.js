const {__} = wp.i18n;

class AtlasVoicePlayerInsights {
    data = {}
    insights = {}
    hooks = wp.hooks;
    pro = 'Pro'
    tooltips = {
        totalInit: __("Number of times the player button was initiated"),
        totalPlay: __("Number of times the play button was clicked"),
        totalPause: __("Number of times the pause button was clicked"),
        totalTime: __("Total time the player has played (in seconds)"),
        totalEnd: __("Number of times the player reached the end"),
        totalDownload: __("Number of times the MP3 file downloaded."),
        averagePlayClickRatio: __("Percentage of times the play button was clicked after initiation"),
        averageListenTillEndRatio: __("Percentage of times users listened till the end"),
        averageListeningTimePerPlay: __("Average listening time per play"),
        averagePausesPerPlay: __("Average number of pauses per play"),
        country: __("Country where the player is opened"),
        deviceType: __("Device type where the player is opened"),
        timeZone: __("Timezone where the player is opened"),
        platform: __("Platform type"),
        browser: __("Browser Name"),
    };
    proPage = 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/';
    place_to_display = 'post_edit'
    chartInstance = null
    chartContainerId = 'atlasVoice_analytics_chart'

    constructor(searchParams, place_to_display = 'post_edit') {
        this.searchParams = searchParams
        this.place_to_display = place_to_display;
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/insights'; // Replace with your backend API URL
        if (place_to_display === 'dashboard') {
            document.getElementById('atlasVoice_analytics').innerHTML = '';
        }
        this.setAnalyticsTitle();
        this.getInsights()

    }

    // Helper function to get total count of events
    getTotalCount(eventType) {
        return this.data[eventType] ? this.data[eventType].count : 0;
    }


    getTotalInit() {
        return this.getTotalCount('init');
    }

    // 5. Total number of pauses
    getTotalPlay() {
        return this.getTotalCount('play');
    }

    // 5. Total number of pauses
    getTotalPause() {
        return this.getTotalCount('pause');
    }

    // 5. Total number of pauses
    getTotalTime() {
        let totalSeconds = this.getTotalCount('time');
        let output = totalSeconds / 60;
        let summeryString = ' Minute';


        if (output > 1) {
            summeryString = ' Minutes';
        }

        if (output > 60) {
            summeryString = ' Hour'
            output = output / 60;
            if (output > 1) {
                summeryString = ' Hours';
            }
        }

        output = output.toFixed(2);

        output += summeryString;

        return output;
    }

    // 5. Total number of pauses
    getTotalEnd() {
        return this.getTotalCount('end');
    }

    getTotalDownload() {
        return this.getTotalCount('download');
    }

    // TODO: move these functions pro version


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


    // 4. Average number of pauses per play
    getAveragePausesPerPlay() {
        const playCount = this.getTotalCount('play');
        const pauseCount = this.getTotalCount('pause');
        return playCount > 0 ? pauseCount / playCount : 0;
    }

    getCountry() {
        return 'abc'
    }

    // Function to generate insights
    generateInsightsPro() {
        let result = {
            totalEnd: this.getTotalEnd(),
            totalDownload: this.getTotalDownload(),
            averagePlayClickRatio: this.getAveragePlayClickRatio().toFixed(2) + '%',
            averageListenTillEndRatio: this.getAverageListenTillEndRatio().toFixed(2) + '%',
            averageListeningTimePerPlay: this.getAverageListeningTimePerPlay().toFixed(2) + ' seconds',
            averagePausesPerPlay: this.getAveragePausesPerPlay().toFixed(2),
        }


        return result;
    }


    // Function to generate insights
    generateInsights() {

        if (ttsObj.is_atlasvoice_addon_functional) {
            let resultFree = this.hooks.applyFilters('atlasVoice_player_insights', {
                totalInit: this.getTotalInit(),
                totalPlay: this.getTotalPlay(),
                totalPause: this.getTotalPause(),
                totalTime: this.getTotalTime(),
            });
            let resultPro = this.generateInsightsPro();

            return {
                ...resultFree,
                ...resultPro
            }

        } else {
            return this.hooks.applyFilters('atlasVoice_player_insights', {
                totalInit: this.getTotalInit(),
                totalPlay: this.getTotalPlay(),
                totalPause: this.getTotalPause(),
                totalTime: this.getTotalTime(),
                totalEnd: this.pro,
                averagePlayClickRatio: this.pro,
                averageListenTillEndRatio: this.pro,
                averageListeningTimePerPlay: this.pro,
                averagePausesPerPlay: this.pro,
            });
        }

    }

    mergeAnalytics(data) {
        const mergedAnalytics = {};

        data.forEach((item, item_key) => {
            const analytics = item.analytics;
            for (const [key, value] of Object.entries(analytics)) {
                if (!value?.count || !value?.timestamp) {
                    if (!value) {
                        continue;
                    }

                    if (!mergedAnalytics[key]) {
                        mergedAnalytics[key] = {}
                    }

                    if (mergedAnalytics[key][value]) {
                        mergedAnalytics[key][value] += 1;
                    } else {
                        mergedAnalytics[key][value] = 1
                    }
                    continue;
                }

                if (!mergedAnalytics[key]) {
                    mergedAnalytics[key] = {count: 0, timestamp: value.timestamp};
                }
                mergedAnalytics[key].count += value.count;
                // Keep the latest timestamp
                if (new Date(value.timestamp) > new Date(mergedAnalytics[key].timestamp)) {
                    mergedAnalytics[key].timestamp = value.timestamp;
                }

            }
        });


        return mergedAnalytics;
    }


    async getInsights() {
        if (this.place_to_display !== 'dashboard' && !this.shouldTrackAnalyticsData()) {
            return;
        }


        let params = new URLSearchParams();

        if (this.searchParams?.post_id) {
            params.append('post_id', this.searchParams.post_id);
        }

        if (this.searchParams?.from_date) {
            params.append('from_date', this.searchParams.from_date);
        }

        if (this.searchParams?.to_date) {
            params.append('to_date', this.searchParams.to_date);
        }
        // Build the final URL
        const param = params.toString() ? `?${params.toString()}` : '';

        this.apiUrl += param;

        let response = await fetch(this.apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-NONCE': window?.ttsObj?.rest_nonce,
            }
        });
        let data = await response.json();
        data = this.mergeAnalytics(data.data)
        this.data = data;
        this.insights = this.generateInsights()


        if (Object.keys(this.insights).length) {
            this.displayInsights()
        }

        return this.insights;
    }

    setInsights(data) {
        // Todo: validate insights.
        this.data = data;
    }

    displayInsights() {
        const tableContainer = document.getElementById('atlasVoice_analytics');
        const table = this.createTable(this.insights);
        let flextDiv = '';
        if (tableContainer && table) {
            flextDiv = document.createElement('div')
            flextDiv.style.width = '100%'
            flextDiv.style.display = 'flex'
            flextDiv.style.minHeight = '500px'
            this.prependCSS(tableContainer);
            tableContainer.appendChild(flextDiv);
            table.style.width = '50%'
            flextDiv.appendChild(table);
        }
        if (flextDiv) {
            let chartDiv = document.createElement('div')
            chartDiv.setAttribute('id', this.chartContainerId);
            chartDiv.style.width = '50%'
            chartDiv.style.height = '100%'
            flextDiv.appendChild(chartDiv);
            this.igniteChart()
        }
    }

    setAnalyticsTitle() {
        const tableContainer = document.getElementById('atlasVoice_analytics');
        if (!tableContainer) {
            return null;
        }
        let title = document.createElement('h2')
        if (!this.shouldTrackAnalyticsData()) {
            title = document.createElement('h1')
            title.innerHTML = 'Tracking analytics for this post is not enabled. Enable it from <strong>Anlytics</strong> menu.'
            tableContainer.appendChild(title);
        } else {
            let perser = new DOMParser();
            let header = `<div style="display:block;margin-top:30px;font-size:20px;background-color:#184c53;color:#fff;padding:5px;" for="">
                Analytics Of The Post
            </div>`
            header = perser.parseFromString(header, 'text/html')

            // Extract the div element from the parsed document
            let headerElement = header.body.firstChild;

            if (tableContainer) {
                tableContainer.prepend(headerElement)
            }
        }
    }

    createTable(data) {
        const table = document.createElement('table');
        if (!table) {
            return null
        }
        table.style.width = '50%'
        // table.style.display = 'flex'
        const headers = ['Metric', 'Value'];
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const row = document.createElement('tr');
                const cellKey = document.createElement('td');
                cellKey.textContent = key;

                const cellValue = document.createElement('td');
                if (data[key] === 'Pro') {
                    const lockIcon = document.createElement('span');
                    lockIcon.innerHTML = '🔒';
                    lockIcon.classList.add('lock-icon', 'has-tooltip');
                    lockIcon.title = __('Click To Visit Price');
                    lockIcon.addEventListener('click', () => {
                        window.open(this.proPage, '_blank'); // Replace with your pro version URL
                    });
                    const tooltip = document.createElement('span');
                    tooltip.classList.add('tooltip');
                    tooltip.textContent = __('This feature is available in the pro version');
                    lockIcon.appendChild(tooltip);
                    cellValue.appendChild(lockIcon);
                } else {
                    cellValue.textContent = data[key];
                }

                if (this.tooltips[key]) {
                    const tooltip = document.createElement('span');
                    tooltip.classList.add('tooltip');
                    tooltip.textContent = this.tooltips[key];
                    cellKey.classList.add('has-tooltip');
                    cellKey.appendChild(tooltip);
                }

                row.appendChild(cellKey);
                row.appendChild(cellValue);
                table.appendChild(row);
            }
        }

        return table;
    }

    prependCSS(container) {
        const style = document.createElement('style');
        style.textContent = `
          #atlasVoice_analytics h2 {
            font-size: 15px;
            font-weight:bold;
            margin-top:10px;
          }
            #atlasVoice_analytics table {
                width: 50%;
                border-collapse: collapse;
                margin: 10px 0px;
            }
            #atlasVoice_analytics th, #atlasVoice_analytics td {
                border: 1px solid #ddd;
                padding: 8px;
                position: relative;
            }
            #atlasVoice_analytics th {
                background-color: #184c53;
                color: white;
            }
            #atlasVoice_analytics .tooltip {
                display: none;
                position: absolute;
                background-color: #333;
                color: #fff;
                padding: 5px;
                border-radius: 5px;
                top: -5px;
                left: 30%;
                z-index: 1;
            }
            #atlasVoice_analytics .has-tooltip:hover .tooltip {
                display: block;
            }
            #atlasVoice_analytics .lock-icon {
                cursor: pointer;
            }
        `;

        container.appendChild(style);
    }


    igniteChart() {

        this.chartAnalyticsData = this.data;
        this.renderLayout();
        this.attachStyles();
        this.initChart();
    }

    /**
     * Creates and appends HTML structure inside the container
     */
    renderLayout() {
        const container = document.getElementById(this.chartContainerId);
        if (!container) return console.error(`Container #${this.chartContainerId} not found`);

        container.innerHTML = `
      <h2>Analytics Data Chart</h2>
      <select id="${this.chartContainerId}_filter">
        <option value="browser">Browser</option>
        <option value="platform">Platform</option>
        <option value="deviceType">Device Type</option>
        <option value="architecture">Architecture</option>
        <option value="language">Language</option>
        <option value="timeZone">Time Zone</option>
        <option value="country">Country</option>
      </select>
      <div class="chart-container">
        <canvas id="${this.chartContainerId}_canvas"></canvas>
      </div>
    `;

        // Bind change event
        const filterSelect = document.getElementById(`${this.chartContainerId}_filter`);
        filterSelect.addEventListener('change', (e) => this.renderChart(e.target.value));
    }

    /**
     * Injects the necessary CSS styling dynamically
     */
    attachStyles() {
        const style = document.createElement('style');
        style.textContent = `
      #${this.chartContainerId} {
        font-family: system-ui, sans-serif;
        background: #f9fafb;
        padding: 10px;
        text-align: center;
      }
      #${this.chartContainerId} .chart-container {
        min-width: 500px;
        max-width: 1000px;
        margin: 10px auto;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 20px;
        min-height: 400px;
      }
      #${this.chartContainerId} select {
        padding: 2px 4px;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 16px;
        margin-bottom: 5px;
      }
    `;
        document.getElementById(this.chartContainerId).appendChild(style);
    }

    /**
     * Initializes the chart for the first time
     */
    initChart() {
        this.renderChart('browser');
    }

    /**
     * Renders or updates the chart for a given data key
     */
    renderChart(filterKey) {
        const ctx = document.getElementById(`${this.chartContainerId}_canvas`);
        if (!ctx) return console.error('Chart canvas not found');
        const dataObj = this.chartAnalyticsData[filterKey];
        if (!dataObj) return console.warn(`No data found for key: ${filterKey}`);

        const labels = Object.keys(dataObj);
        const values = Object.values(dataObj);

        // Destroy existing chart instance if any
        if (this.chartInstance) this.chartInstance.destroy();

        // Create a new chart
        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: filterKey,
                    data: values,
                    backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {display: false},
                    title: {display: true, text: `Analytics by ${filterKey}`}
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            // forces step size to be 10 units
                            stepSize: 50
                        }
                    },
                }
            }
        });
    }

    shouldTrackAnalyticsData() {
        if (!window?.ttsObj?.settings?.analytics?.tts_enable_analytics) {
            return false;
        }

        const trackableIds = window?.ttsObj?.settings?.analytics?.tts_trackable_post_ids;

        // No explicit list configured → every post is trackable.
        if (!trackableIds?.length) {
            return true;
        }

        // TTS-247: compare as strings — stored IDs may be numbers while the
        // requested post_id is a string. A strict includes() would never match
        // and wrongly report "not enabled". Also, the "all" sentinel and the
        // per-post match are data-driven and no longer gated by is_atlasvoice_addon_functional
        // (Pro injects "all" via the tts_trackable_post_ids filter).
        const ids = trackableIds.map((id) => String(id));
        const postId = String(this.searchParams?.post_id ?? "");

        return ids.includes("all") || ids.includes(postId);
    }


}

export default AtlasVoicePlayerInsights;

/**
 * Load AtlasVoicePlayerAnalytics after DOMContentLoaded if pro version exists.
 */
if (window?.ttsObj?.is_atlasvoice_addon_functional) {
    window.AtlasVoicePlayerInsights = AtlasVoicePlayerInsights;
}

if (window?.ttsObj?.is_admin_page) {
    let post_id = getPostIdFromUrl(window.location.href)
    if (post_id) {
        new AtlasVoicePlayerInsights({post_id: post_id})
    } else {
        new AtlasVoicePlayerInsights()
        // console.error('Post Id is not found:' + post_id)
    }

}

function getPostIdFromUrl(url) {
    try {
        console.log(url)
        // Create a URL object
        const urlObj = new URL(url);

        // Use URLSearchParams to get the value of the 'post' parameter
        const post_id = urlObj.searchParams.get('post');

        return post_id;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}
