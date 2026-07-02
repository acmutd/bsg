type NotificationToggleProps = {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
};

export const NotificationToggle = ({
    enabled,
    onChange,
    disabled = false,
}: NotificationToggleProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Chat notifications"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`
            relative h-9 w-[4.625rem] shrink-0 rounded-full
            transition-colors duration-200 ease-in-out
            disabled:cursor-not-allowed disabled:opacity-50
            ${enabled ? 'bg-primary' : 'border border-white/80 bg-transparent'}
        `}
    >
        {/* Label sits in the empty half, opposite the knob */}
        <span
            className={`
                pointer-events-none absolute inset-0 z-0 flex items-center
                text-[11px] font-bold tracking-wide
                ${enabled ? 'justify-start pl-2.5 text-[#262626]' : 'justify-end pr-2.5 text-white'}
            `}
        >
            {enabled ? 'ON' : 'OFF'}
        </span>

        {/* Knob — use left positioning instead of translate-x */}
        <span
            className={`
                absolute top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full bg-white shadow-sm
                transition-[left] duration-200 ease-in-out
                ${enabled ? 'left-[calc(100%-1.75rem-0.25rem)]' : 'left-1'}
            `}
        />
    </button>
);