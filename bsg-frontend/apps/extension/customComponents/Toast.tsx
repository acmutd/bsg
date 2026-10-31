import { useEffect } from 'react';

type ToastProps = {
    message: string | null;
    onDismiss: () => void;
    durationMs?: number;
};

export const Toast = ({ message, onDismiss, durationMs = 4000 }: ToastProps) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(timer);
    }, [message, onDismiss, durationMs]);

    if (!message) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
            <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-md border border-red-500/50 bg-red-950/90 px-3 py-2 text-sm text-red-200 shadow-lg backdrop-blur-md"
            >
                <span>{message}</span>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss notification"
                    className="shrink-0 rounded px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                >
                    x
                </button>
            </div>
        </div>
    );
};
