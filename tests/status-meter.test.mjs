/**
 * TTS-347: the meter under the player while audio is made. Run with: npm test
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import StatusMeter from '../admin/js/tts/AtlasVoiceStatusMeter.js';

beforeEach(() => {
    globalThis.document = {
        createElement: (tag) => ({ tag, attrs: {}, style: {}, children: [], setAttribute(n, v) { this.attrs[n] = v; }, append(...c) { this.children.push(...c); } }),
    };
});

test('a share becomes a whole percentage between 0 and 100', () => {
    assert.equal(StatusMeter.percentOf(0), 0);
    assert.equal(StatusMeter.percentOf(0.4), 40);
    assert.equal(StatusMeter.percentOf(1 / 3), 33);
    assert.equal(StatusMeter.percentOf(1), 100);
    assert.equal(StatusMeter.percentOf(1.7), 100);
    assert.equal(StatusMeter.percentOf(-2), 0);
});

test('what is not a share has no percentage and no meter', () => {
    for (const value of [undefined, null, '0.5', NaN, Infinity]) {
        assert.equal(StatusMeter.percentOf(value), null);
        assert.deepEqual(StatusMeter.meterFor(value, 'Making the audio'), []);
    }
});

test('the meter says its value to a screen reader and shows the number', () => {
    const [meter, number] = StatusMeter.meterFor(0.4, 'Making the audio · part 3 of 5');

    assert.equal(meter.attrs.role, 'progressbar');
    assert.equal(meter.attrs['aria-valuenow'], '40');
    assert.equal(meter.attrs['aria-valuemin'], '0');
    assert.equal(meter.attrs['aria-valuemax'], '100');
    assert.equal(meter.attrs['aria-label'], 'Making the audio · part 3 of 5');
    assert.equal(meter.children[0].style.width, '40%');
    assert.equal(number.textContent, '40%');
});
