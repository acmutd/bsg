import assert from 'node:assert/strict';
import { test } from 'node:test';
import { roundDeadline } from './roundTiming';

test('replaying a 30-minute round after navigation preserves its original deadline', () => {
    const startTime = 1_800_000_000;
    const data = { startTime, serverNow: startTime, duration: 30 };
    const deadline = roundDeadline(data);
    assert.equal(deadline, (startTime + 1800) * 1000);
    // Reconnects can send a fresh serverNow; history can send the original one.
    assert.equal(roundDeadline({ ...data, serverNow: startTime + 600 }), deadline);
    assert.equal(roundDeadline(data), deadline);
    assert.equal(deadline! - (startTime + 600) * 1000, 20 * 60 * 1000);
    assert.ok(deadline! <= (startTime + 1801) * 1000);
});

test('announcements and malformed timing never create a fresh 30-minute round', () => {
    for (const data of [null, 'The round has started', {}, { duration: 30 },
        { startTime: 1_800_000_000, duration: 0 }, { startTime: NaN, duration: 30 },
        { startTime: 1_800_000_000, duration: Infinity }]) {
        assert.equal(roundDeadline(data), null);
    }
});
