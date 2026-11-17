/**
 * TTS-354: the state of one Bulk MP3 run, for the message on the page.
 *
 * Before, the screen counted only the files that were made and opened a
 * browser pop-up when that count reached the number of posts. A post that
 * could not be made kept the count below it, so no end message came at all,
 * and the pop-up blocked the page until it was closed. Now every post is
 * counted as made or not made, and the run ends after the last one either way.
 *
 * No React and no WordPress in here, so the rules can be tested on their own.
 */

/** A run that has not started. */
export function idleRun() {
    return { status: 'idle', total: 0, made: 0, failed: 0 };
}

/**
 * A run that starts.
 *
 * @param {number} total How many posts it makes the audio of.
 * @return {Object}
 */
export function startRun(total) {
    const count = Math.max(0, Math.floor(Number(total) || 0));

    return { status: count ? 'running' : 'done', total: count, made: 0, failed: 0 };
}

/**
 * The run after one more post.
 *
 * @param {Object}  run  The run so far.
 * @param {boolean} made Whether this post's audio is there now.
 * @return {Object} A new run; the one given is not changed.
 */
export function stepRun(run, made) {
    if (!run || run.status !== 'running') {
        return run;
    }

    const next = {
        ...run,
        made: run.made + (made ? 1 : 0),
        failed: run.failed + (made ? 0 : 1),
    };
    if (next.made + next.failed >= next.total) {
        next.status = 'done';
    }

    return next;
}

/**
 * How a finished run went.
 *
 * @param {Object} run The run.
 * @return {string} 'all', 'some' or 'none'; '' while it is not finished.
 */
export function outcomeOf(run) {
    if (!run || run.status !== 'done') {
        return '';
    }
    if (run.total > 0 && run.made === run.total) {
        return 'all';
    }

    return run.made > 0 ? 'some' : 'none';
}

export default { idleRun, startRun, stepRun, outcomeOf };
