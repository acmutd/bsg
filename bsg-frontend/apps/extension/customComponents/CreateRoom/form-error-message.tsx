type FormErrorMessageProps = {
    message: string | null;
    onDismiss: () => void;
    className?: string;
};

// Dismissible error banner shared by both create-room tabs.
export const FormErrorMessage = ({message, onDismiss, className = ''}: FormErrorMessageProps) => {
    if (!message) return null

    return (
        <div className={`rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-200 ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <span>{message}</span>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss error"
                    className="shrink-0 rounded px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                >
                    x
                </button>
            </div>
        </div>
    )
}
