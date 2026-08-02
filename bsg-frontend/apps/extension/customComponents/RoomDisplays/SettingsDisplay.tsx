import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { getServerUrl } from '../../lib/config';
import { Label } from '@bsg/ui/label';
import { Slider } from '@bsg/ui/slider';
import { NotificationToggle } from '../NotificationToggle';
import { useSettingsStore } from '@/stores/useSettingsStore';

const MIN_DURATION = 5;
const MAX_DURATION = 120;
const STEP = 5;


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


    const chatNotificationsEnabled = useSettingsStore(s => s.chatNotificationsEnabled);
    const setChatNotificationsEnabled = useSettingsStore(s => s.setChatNotificationsEnabled);
    const themePreference = useSettingsStore(s => s.themePreference);
    const setThemePreference = useSettingsStore(s => s.setThemePreference);
    const loadSettings = useSettingsStore(s => s.loadSettings);

    useEffect(() => {
        if (isActive) loadSettings();
    }, [isActive, loadSettings]);

    
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
            const res = await fetch(`${getServerUrl()}/rooms/${roomId}/rounds/time`, {
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

    //timer update success message timeout
    useEffect(() => {
        if (!saved) return;
    
        const timeout = setTimeout(() => {
            setSaved(false);
        }, 3000);
    
        return () => clearTimeout(timeout);
    }, [saved]);

    return (
        <div className={`flex flex-col h-full p-4 gap-4 ${(isActive) ? '' : 'hidden'}`}>
            <div className="text-base font-medium">Settings</div>

            <div className="flex flex-col gap-2 w-full">
                <div className="text-sm text-foreground/60 font-medium">Edit Timer</div>

                <div className="rounded-lg border border-bsg-border p-4">
                    {!isAdmin ? (
                        <p className="text-sm text-foreground/50">
                            Only the room admin can change the timer.
                        </p>
                    ) : isRoundStarted ? (
                        <p className="text-sm text-foreground/50">
                            The timer can only be edited before the round starts.
                        </p>
                    ) : (
                        <div>
                            <Label className="text-lg">Timer: {value} mins</Label>
                            <Slider
                                min={MIN_DURATION}
                                max={MAX_DURATION}
                                step={STEP}
                                value={[value]}
                                onValueChange={(val) => change(val[0])}
                                className="pt-2 max-w-[377px]"
                            />
                        </div>
                    )}
                </div>
            </div>


            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Chat sounds</span>
                    <span className="text-xs text-foreground/50">
                        Play a sound when messages are sent or received
                    </span>
                </div>
                <NotificationToggle
                    enabled={chatNotificationsEnabled}
                    onChange={setChatNotificationsEnabled}
                />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <div className="text-sm text-foreground/60 font-medium">Theme</div>
                <div className="flex gap-1 rounded-lg border border-bsg-border p-1">
                    {(['auto', 'dark', 'light'] as const).map((pref) => (
                        <button
                            key={pref}
                            onClick={() => setThemePreference(pref)}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                themePreference === pref
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-transparent text-foreground/60 hover:bg-bsg-hover'
                            }`}
                        >
                            {pref === 'auto' ? 'Auto' : pref === 'dark' ? 'Dark' : 'Light'}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-foreground/50">
                    {themePreference === 'auto'
                        ? 'Follows LeetCode\'s theme setting'
                        : `Locked to ${themePreference} mode`}
                </span>
            </div>

            {isAdmin && !isRoundStarted && (
                <div className="mt-auto">
                    {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                    {saved && !dirty && (
                        <p className="mb-2 text-xs text-green-400">Timer updated.</p>
                    )}
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !dirty}
                        className="w-full rounded-md bg-bsg-glass py-2 text-sm font-medium hover:bg-bsg-hover disabled:opacity-30"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            )}
        </div>
    );
};
