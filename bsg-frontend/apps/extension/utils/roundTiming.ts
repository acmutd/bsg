// A round's deadline belongs to the round, never to the page or event receipt time.
export function roundDeadline(data: unknown): number | null {
    if (!data || typeof data !== 'object') return null;
    const { startTime, duration } = data as { startTime?: unknown; duration?: unknown };
    if (typeof startTime !== 'number' || !Number.isFinite(startTime) || startTime <= 0 ||
        typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) return null;
    const deadline = (startTime + duration * 60) * 1000;
    return Number.isFinite(deadline) ? deadline : null;
}
