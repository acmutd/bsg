import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../../lib/config';

const MIN_DURATION = 5;
const MAX_DURATION = 120;
const STEP = 5;
const PRESETS = [15, 30, 45, 60];

export const SettingsDisplay = ({ isActive }: { isActive: boolean }) => {

    const roomId = useRoomStore(s => s.roomId);
    const isAdmin = useRoomStore(s => s.isAdmin);
    const isRoundStarted = useRoomStore(s => s.isRoundStarted);
    const roundDuration = useRoomStore(s => s.roundDuration);
    const setRoundDuration = useRoomStore(s => s.setRoundDuration);

    const [ value, setValue ] = useState<number>(roundDuration ?? 30);
    const [ saving, setSaving ] = useState<boolean>(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ saved, setSaved ] = useState<boolean>(false);

    // Sync the working value when the stored duration changes or the tab reopens.
    useEffect(() => {
        if (roundDuration != null) setValue(roundDuration);
    }, [roundDuration, isActive]);

    const clamp = (n: number) => Math.max(MIN_DURATION, Math.min(MAX_DURATION, n));
    const change = (next: number) => {
        setValue(clamp(next));
        setSaved(false);
        setError(null);
    };

    const dirty = value !== roundDuration;

    const onSave = async () => {
        if (!roomId) {
            setError('Not in a room.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomId}/rounds/time`, {
                method: 'POST',
                body: JSON.stringify({ duration: value }),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setError((data && (data.error || data.message)) || `Failed to update timer: ${res.status}`);
            } else {
                setRoundDuration(data?.data?.duration ?? value);
                setSaved(true);
            }
        } catch (e: any) {
            setError(e?.message || 'Failed to update timer.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`flex flex-col p-4 gap-4 ${(isActive) ? '' : 'hidden'}`}>
            <div className="text-base font-medium">Settings</div>

            <div className="flex flex-col gap-2 w-full">
                <div className="text-sm text-foreground/60 font-medium">Edit Timer</div>

                <div className="rounded-lg border border-[#454545] p-4">
                    {!isAdmin ? (
                        <p className="text-sm text-foreground/50">
                            Only the room admin can change the timer.
                        </p>
                    ) : isRoundStarted ? (
                        <p className="text-sm text-foreground/50">
                            The timer can only be edited before the round starts.
                        </p>
                    ) : (
                        <>
                            <p className="mb-3 text-sm text-foreground/50">
                                Set how long the round will run. Applies when you start the round.
                            </p>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => change(value - STEP)}
                                    disabled={value <= MIN_DURATION}
                                    aria-label="Decrease timer"
                                    className="h-9 w-9 rounded-md bg-white/10 text-xl leading-none hover:bg-[#484848] disabled:opacity-30"
                                >
                                    −
                                </button>
                                <div className="min-w-[5.5rem] text-center">
                                    <span className="text-3xl font-semibold text-foreground/90">{value}</span>
                                    <span className="ml-1 text-sm text-foreground/50">min</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => change(value + STEP)}
                                    disabled={value >= MAX_DURATION}
                                    aria-label="Increase timer"
                                    className="h-9 w-9 rounded-md bg-white/10 text-xl leading-none hover:bg-[#484848] disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => change(p)}
                                        className={`rounded-md px-3 py-1 text-xs hover:bg-[#484848] ${
                                            value === p
                                                ? 'bg-white/20 text-foreground/90'
                                                : 'bg-white/5 text-foreground/60'
                                        }`}
                                    >
                                        {p}m
                                    </button>
                                ))}
                            </div>

                            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
                            {saved && !dirty && (
                                <p className="mt-3 text-xs text-green-400">Timer updated.</p>
                            )}

                            <button
                                type="button"
                                onClick={onSave}
                                disabled={saving || !dirty}
                                className="mt-4 w-full rounded-md bg-white/10 py-2 text-sm font-medium hover:bg-[#484848] disabled:opacity-30"
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
