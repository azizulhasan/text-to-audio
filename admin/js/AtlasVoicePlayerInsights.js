const {__} = wp.i18n;

class AtlasVoicePlayerInsights {
    data = {}
    insights = {}
    hooks = wp.hooks;
    pro = __('Pro')
    tooltips = {
        totalInit: __("Number of times the player button was initiated"),
        totalPlay: __("Number of times the play button was clicked"),
        totalPause: __("Number of times the pause button was clicked"),
        totalTime: __("Total time the player has played (in seconds)"),
        totalEnd: __("Number of times the player reached the end"),
        averagePlayClickRatio: __("Percentage of times the play button was clicked after initiation"),
        averageListenTillEndRatio: __("Percentage of times users listened till the end"),
        averageListeningTimePerPlay: __("Average listening time per play"),
        averagePausesPerPlay: __("Average number of pauses per play"),
    };
    proPage = 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/';

    constructor(postId = '') {
        this.postId = postId
        this.apiUrl = ttsObj.api_url + ttsObj.api_namespace + '/' + ttsObj.api_version + '/insights/' + this.postId; // Replace with your backend API URL
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
        return this.getTotalCount('time');
    }

    // 5. Total number of pauses
    getTotalEnd() {
        return this.getTotalCount('end');
    }


    // Function to generate insights
    generateInsights() {
        return this.hooks.applyFilters('atlasVoice_player_insights', {
            totalInit: this.getTotalInit(),
            totalPlay: this.getTotalPlay(),
            totalPause: this.getTotalPause(),
            totalTime: this.getTotalTime(),
            totalEnd: this.getTotalEnd(),
            averagePlayClickRatio: this.pro,
            averageListenTillEndRatio: this.pro,
            averageListeningTimePerPlay: this.pro,
            averagePausesPerPlay: this.pro,
        });
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
        }
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
        this.prependCSS(tableContainer);
        const table = this.createTable(this.insights);
        tableContainer.appendChild(table);
    }

    createTable(data) {
        const table = document.createElement('table');

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
                    lockIcon.title = 'This feature is available in the pro version';
                    lockIcon.addEventListener('click', () => {
                        window.open(this.proPage, '_blank'); // Replace with your pro version URL
                    });
                    const tooltip = document.createElement('span');
                    tooltip.classList.add('tooltip');
                    tooltip.textContent = 'This feature is available in the pro version';
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

}

export default AtlasVoicePlayerInsights;

/**
 * Load AtlasVoicePlayerAnalytics after DOMContentLoaded if pro version exists.
 */
if (window?.ttsObj?.is_pro_active) {
    window.AtlasVoicePlayerInsights = AtlasVoicePlayerInsights;
}

if (window?.ttsObj?.is_admin_page) {
    let postId = getPostIdFromUrl(window.location.href)
    if (postId) {
        new AtlasVoicePlayerInsights(postId)
    } else {
        console.error('Post Id is not found:' + postId)
    }

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
