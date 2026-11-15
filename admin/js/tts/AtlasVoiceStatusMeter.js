/**
 * TTS-347: how much of a post's audio is made, as a number for the meter
 * under the player.
 */

/**
 * A share of the whole as a percentage.
 *
 * @param {number} share 0 to 1.
 * @return {number|null} 0 to 100, or null when it is not a share.
 */
export function percentOf(share) {
    if (typeof share !== 'number' || !isFinite(share)) {
        return null;
    }
    return Math.max(0, Math.min(100, Math.round(share * 100)));
}

/**
 * The meter and its percentage, to put after the status text.
 *
 * @param {number} share 0 to 1.
 * @param {string} label What the meter measures, for a screen reader.
 * @return {HTMLElement[]} The meter and the number; empty when there is no share.
 */
export function meterFor(share, label) {
    const percent = percentOf(share);
    if (percent === null) {
        return [];
    }

    const meter = document.createElement('span');
    meter.className = 'atlasvoice-mp3-player__meter';
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', '100');
    meter.setAttribute('aria-valuenow', String(percent));
    meter.setAttribute('aria-label', label);
    const bar = document.createElement('i');
    bar.style.width = percent + '%';
    meter.append(bar);

    const number = document.createElement('span');
    number.className = 'atlasvoice-mp3-player__percent';
    number.textContent = percent + '%';

    return [meter, number];
}

export default { percentOf, meterFor };
