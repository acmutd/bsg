const CORNERS = [
    "M136 32c13.3 0 24 10.7 24 24s-10.7 24-24 24H48v88c0 13.3-10.7 24-24 24s-24-10.7-24-24V56C0 42.7 10.7 32 24 32H136z",
    "M0 344c0-13.3 10.7-24 24-24s24 10.7 24 24v88h88c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V344z",
    "M424 32c13.3 0 24 10.7 24 24V168c0 13.3-10.7 24-24 24s-24-10.7-24-24V80H312c-13.3 0-24-10.7-24-24s10.7-24 24-24H424z",
    "M400 344c0-13.3 10.7-24 24-24s24 10.7 24 24V456c0 13.3-10.7 24-24 24H312c-13.3 0-24-10.7-24-24s10.7-24 24-24h88V344z",
];

export const MaximizeIcon = ({ maximized }: { maximized: boolean }) => {
    return (
        <svg
            className="h-[1em] w-[1em]"
            viewBox="0 0 448 512"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            {CORNERS.map((d) => (
                <path
                    key={d}
                    d={d}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        transform: maximized ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                    }}
                />
            ))}
        </svg>
    );
};
