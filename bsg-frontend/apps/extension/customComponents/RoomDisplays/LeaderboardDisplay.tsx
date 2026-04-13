import React from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import { Participant } from "@bsg/models/Participant";

// ─── Helpers ────────────────────────────────────────────────────────────────

const initials = (name: string) => name[0]?.toUpperCase() ?? "?";

/** Converts "#72ab1c" → "114,171,28" so it's safe to use inside rgba() */
const hexToRgb = (hex: string): string => {
    const clean = hex.replace("#", "").slice(0, 6);
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r},${g},${b}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

type AvatarSize = "sm" | "md" | "lg";

const sizeMap: Record<AvatarSize, string> = {
    lg: "w-14 h-14 text-2xl",
    md: "w-10 h-10 text-lg",
    sm: "w-7 h-7 text-sm",
};

const PlayerAvatar = ({
    participant,
    size = "md",
}: {
    participant: Participant;
    size?: AvatarSize;
}) => {
    const sizeClass = sizeMap[size];

    return participant.avatarUrl ? (
        <img
            src={participant.avatarUrl}
            alt={participant.username}
            className={`${sizeClass} rounded-xl object-cover border-2 border-[#72ab1c]/40`}
        />
    ) : (
        <div
            className={`${sizeClass} rounded-xl flex items-center justify-center font-bold text-white border-2 border-[#72ab1c]/40`}
            style={{ background: "linear-gradient(135deg, #72ab1c, #4d7a10)" }}
        >
            {initials(participant.username)}
        </div>
    );
};

// ─── Podium config ────────────────────────────────────────────────────────────

type PodiumSlot = {
    rank: 1 | 2 | 3;
    columnOrder: 0 | 1 | 2;
    podiumHeight: string;
    avatarSize: AvatarSize;
    rankTextSize: string;
    /** 0–1 decimal for rgba usage */
    glowOpacity: number;
    borderOpacity: number;
    topRoofOpacity: number;
    showTrophy: boolean;
    /** Hex color for this podium slot's accents, defaults to #72ab1c */
    color?: string;
    podiumBackground?: string;
};

const PODIUM_SLOTS: PodiumSlot[] = [
    {
        rank: 2,
        columnOrder: 0,
        podiumHeight: "h-[160px]",
        avatarSize: "md",
        rankTextSize: "text-3xl",
        glowOpacity: 0.30,
        borderOpacity: 0.30,
        topRoofOpacity: 0.40,
        showTrophy: false,
        color: "#72ab1c",
        podiumBackground: "linear-gradient(to bottom, rgba(58,85,24,0.6), rgba(42,61,18,0.8), rgba(30,42,13,0.9))",
    },
    {
        rank: 1,
        columnOrder: 1,
        podiumHeight: "h-[200px]",
        avatarSize: "lg",
        rankTextSize: "text-4xl",
        glowOpacity: 0.80,
        borderOpacity: 0.90,
        topRoofOpacity: 0.90,
        showTrophy: true,
        color: "#587f28ff",
        podiumBackground: "linear-gradient(to bottom, rgba(88, 127, 40, 1), rgba(50, 87, 24, 0.8), rgba(30,42,13,0.9))",
    },
    {
        rank: 3,
        columnOrder: 2,
        podiumHeight: "h-[120px]",
        avatarSize: "md",
        rankTextSize: "text-2xl",
        glowOpacity: 0.15,
        borderOpacity: 0.30,
        topRoofOpacity: 0.30,
        showTrophy: false,
        color: "#93c449ff",
        podiumBackground: "linear-gradient(to bottom, rgba(50, 74, 20, 0.6), rgba(40, 61, 15, 0.8), rgba(30,42,13,0.9))",
    },
];

const TrophyIcon = () => (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#1a1a1a] rounded-full p-1 border border-[#72ab1c]/40 shadow-lg shadow-[#72ab1c]/20">
        <svg viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                stroke="#72ab1c"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

const PodiumColumn = ({
    slot,
    participant,
}: {
    slot: PodiumSlot;
    participant: Participant | undefined;
}) => {
    if (!participant) return <div className="flex-1" />;

    const { rank, podiumHeight, avatarSize, rankTextSize, glowOpacity, borderOpacity, topRoofOpacity, showTrophy, color = "#72ab1c" } = slot;

    const rgb = hexToRgb(color);
    const glowColor = `rgba(${rgb},${glowOpacity})`;
    const borderColor = `rgba(${rgb},${borderOpacity})`;
    const roofColor = `rgba(${rgb},${topRoofOpacity})`;

    return (
        <div className="flex-1 flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-2 group">
                <div
                    className="absolute inset-0 blur-lg rounded-full transition-all duration-300"
                    style={{ backgroundColor: glowColor }}
                />
                <div className="relative group-hover:scale-110 transition-transform duration-300">
                    <PlayerAvatar participant={participant} size={avatarSize} />
                </div>
                {showTrophy && <TrophyIcon />}
            </div>

            {/* Podium block */}
            <div className={`relative w-full ${podiumHeight}`}>
                {/* Trapezoid roof */}
                <div
                    className="absolute top-0 left-0 right-0 h-5"
                    style={{
                        backgroundColor: roofColor,
                        clipPath: "polygon(0 100%, 12px 0, calc(100% - 12px) 0, 100% 100%)",
                    }}
                />
                {/* Podium body */}
                <div
                    className="absolute inset-0 top-5 overflow-hidden"
                    style={{
                        background: slot.podiumBackground || "linear-gradient(to bottom, rgba(58,85,24,0.6), rgba(42,61,18,0.8), rgba(30,42,13,0.9))",
                        borderTop: `1px solid ${borderColor}`,
                        borderLeft: rank !== 3 ? `1px solid ${borderColor}` : undefined,
                        borderRight: rank !== 2 ? `1px solid ${borderColor}` : undefined,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#72ab1c]/10 to-transparent" />
                </div>
                <div className="relative pt-6 px-2 flex flex-col items-center">
                    <div className={`${rankTextSize} font-bold text-[#72ab1c] mb-1`}>{rank}</div>
                    <p className="font-semibold text-white text-center text-xs truncate w-full px-1">
                        {participant.username}
                    </p>
                    <p className="text-[#72ab1c] font-mono text-xs mt-1">
                        {participant.score.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const LeaderboardDisplay = ({ isActive }: { isActive: boolean }) => {
    const users = useRoomStore((s) => s.participants);

    let participants: Participant[] = users.map((user, index) => ({
        id: user.id || index.toString(),
        username: user.name || "Unknown User",
        avatarUrl: user.photo,
        defaultColor: "#72ab1c",
        currentProblemIndex: 0,
        score: (users.length - index) * 100, // temp
    }));

    // Dummy data for empty rooms
    if (participants.length === 0) {
        participants = [
            { id: "1", username: "PIMPDEV22", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 10000 },
            { id: "2", username: "Bob_Builder", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 820 },
            { id: "3", username: "googoo ga ga", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 710 },
            { id: "4", username: "Diddy", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 580 },
            { id: "5", username: "Eve_Johnson", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 430 },
            { id: "6", username: "Frank_Castle", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 310 },
            { id: "7", username: "MUAHAHAHA", defaultColor: "#72ab1c", currentProblemIndex: 0, score: 310 },
        ];
    }

    const sorted = [...participants].sort((a, b) => b.score - a.score);

    // Map rank → participant for easy lookup
    const byRank: Record<number, Participant | undefined> = {
        1: sorted[0],
        2: sorted[1],
        3: sorted[2],
    };

    const rest = sorted.slice(3);

    return (
        <div className={`h-full flex flex-col bg-[#262626] ${isActive ? "" : "hidden"}`}>

            {/* Header */}
            <div className="text-center py-4 px-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
                <p className="text-[#aaaaaa] text-sm mt-1">Current Room Rankings</p>
                <div className="mx-auto mt-2 w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#72ab1c] to-transparent" />
            </div>

            {/* Empty state */}
            {sorted.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-[#72ab1c]/30 blur-xl rounded-full" />
                        <div className="relative w-12 h-12 bg-[#1a1a1a] rounded-full p-2 border border-[#72ab1c]/40 shadow-lg shadow-[#72ab1c]/20">
                            <svg viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                                    stroke="#72ab1c"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[#72ab1c] font-bold text-lg tracking-tight">No Participants Yet!</p>
                    <p className="text-[#aaaaaa] text-sm mt-1">Waiting for players to join the room</p>
                    <div className="mt-3 w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#72ab1c] to-transparent" />
                </div>
            )}

            {/* Podium + list */}
            {sorted.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0">

                    {/* Podium */}
                    <div className="flex items-end flex-shrink-0 gap-2 pt-6">
                        {PODIUM_SLOTS.map((slot) => (
                            <PodiumColumn
                                key={slot.rank}
                                slot={slot}
                                participant={byRank[slot.rank]}
                            />
                        ))}
                    </div>

                    {/* Ranked list (4th place and below) */}
                    <div
                        className="flex-1 min-h-0 bg-gradient-to-b from-[#1e2a0d]/90 to-[#141f08]/95 border-x border-b border-[#72ab1c]/20 overflow-y-auto"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#72ab1c55 transparent" }}
                    >
                        {rest.length > 0 ? (
                            <div className="p-3 space-y-2">
                                {rest.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className="bg-[#262626]/70 border border-[#3a3a3a]/80 rounded-lg p-3 hover:bg-[#2e2e2e]/80 hover:border-[#72ab1c]/30 hover:shadow-md hover:shadow-[#72ab1c]/5 transition-all duration-200 group backdrop-blur-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-[#1a1a1a] rounded-lg flex items-center justify-center font-bold text-[#aaaaaa] text-sm border border-[#3a3a3a] group-hover:border-[#72ab1c]/30 transition-colors flex-shrink-0">
                                                    #{index + 4}
                                                </div>
                                                <div className="group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                                                    <PlayerAvatar participant={player} size="sm" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white text-sm truncate">
                                                        {player.username}
                                                    </p>
                                                    <p className="text-[#aaaaaa] text-xs mt-0.5">
                                                        Rank {index + 4}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-lg font-bold text-white font-mono">
                                                    {player.score.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-[#aaaaaa]">pts</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};