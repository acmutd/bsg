import React from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserStore } from "@/stores/useUserStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { Participant } from "@bsg/models/Participant";

// ─── Helpers ────────────────────────────────────────────────────────────────

const initials = (name: string) => name[0]?.toUpperCase() ?? "?";

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
    isYou = false,
}: {
    participant: Participant;
    size?: AvatarSize;
    isYou?: boolean;
}) => {
    const sizeClass = sizeMap[size];
    const ringClass = isYou ? "ring-2 ring-[#72ab1c] ring-offset-2 ring-offset-bsg-bg" : "";

    return participant.avatarUrl ? (
        <img
            src={participant.avatarUrl}
            alt={participant.username}
            className={`${sizeClass} rounded-xl object-cover border-2 border-[#72ab1c]/40 ${ringClass}`}
        />
    ) : (
        <div
            className={`${sizeClass} rounded-xl flex items-center justify-center font-bold text-white border-2 border-[#72ab1c]/40 ${ringClass}`}
            style={{ background: "linear-gradient(135deg, #72ab1c, #4d7a10)" }}
        >
            {initials(participant.username)}
        </div>
    );
};

const MiniTrophy = () => (
    <svg viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
        <path
            d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
            stroke="#72ab1c"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// ─── Top-3 strip config ──────────────────────────────────────────────────────

type TopCardStyle = {
    cardClass: string;
    badgeClass: string;
    avatarSize: AvatarSize;
    scoreClass: string;
    showTrophy: boolean;
};

const TOP_STYLES: Record<1 | 2 | 3, TopCardStyle> = {
    1: {
        cardClass: "border-[#72ab1c]/60 bg-[#72ab1c]/10 shadow-lg shadow-[#72ab1c]/10",
        badgeClass: "bg-[#72ab1c] text-bsg-dark",
        avatarSize: "md",
        scoreClass: "text-[#72ab1c]",
        showTrophy: true,
    },
    2: {
        cardClass: "border-[#72ab1c]/30 bg-bsg-surface-alt/40",
        badgeClass: "border border-[#72ab1c]/40 text-[#93c449]",
        avatarSize: "md",
        scoreClass: "text-[#93c449]",
        showTrophy: false,
    },
    3: {
        cardClass: "border-[#72ab1c]/20 bg-bsg-surface-alt/20",
        badgeClass: "border border-[#72ab1c]/30 text-[#aaaaaa]",
        avatarSize: "sm",
        scoreClass: "text-[#aaaaaa]",
        showTrophy: false,
    },
};

const TopPlayerCard = ({
    rank,
    participant,
    isYou,
}: {
    rank: 1 | 2 | 3;
    participant: Participant;
    isYou: boolean;
}) => {
    const style = TOP_STYLES[rank];

    return (
        <div
            className={`flex-1 min-w-0 rounded-xl border px-2 pt-2.5 pb-3 flex flex-col items-center gap-1.5 relative overflow-hidden ${style.cardClass}`}
        >
            <div
                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${style.badgeClass}`}
            >
                {rank}
            </div>
            {style.showTrophy && (
                <div className="absolute top-1.5 right-1.5">
                    <MiniTrophy />
                </div>
            )}
            <PlayerAvatar participant={participant} size={style.avatarSize} isYou={isYou} />
            <p className="font-semibold text-white text-xs truncate w-full text-center px-1">
                {participant.username}
            </p>
            <p className={`font-mono text-xs ${style.scoreClass}`}>
                {participant.score.toLocaleString()}
            </p>
        </div>
    );
};

const RankRow = ({
    rank,
    participant,
    isYou,
}: {
    rank: number;
    participant: Participant;
    isYou: boolean;
}) => (
    <div
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors ${
            isYou
                ? "border-[#72ab1c]/50 bg-[#72ab1c]/10"
                : "border-[rgb(var(--bsg-surface-alt)/0.8)] bg-[rgb(var(--bsg-bg)/0.7)] hover:bg-[rgb(var(--bsg-surface-alt)/0.5)]"
        }`}
    >
        <div className="flex items-center gap-3 min-w-0">
            <span
                className={`w-6 text-right font-mono text-sm flex-shrink-0 ${
                    isYou ? "text-[#72ab1c] font-bold" : "text-[#aaaaaa]"
                }`}
            >
                {rank}
            </span>
            <PlayerAvatar participant={participant} size="sm" isYou={isYou} />
            <p
                className={`font-medium text-sm truncate ${
                    isYou ? "text-[#72ab1c]" : "text-white"
                }`}
            >
                {participant.username}
            </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {isYou && (
                <span className="text-[9px] uppercase tracking-wider text-[#72ab1c] font-bold border border-[#72ab1c]/40 rounded px-1 py-0.5">
                    You
                </span>
            )}
            <span className="font-mono text-sm font-bold text-white">
                {participant.score.toLocaleString()}
            </span>
        </div>
    </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const LeaderboardSkeleton = () => (
    <div className="flex-1 flex flex-col gap-3 p-4 animate-pulse">
        {/* Top-3 strip skeleton */}
        <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1 h-24 rounded-xl bg-bsg-surface-alt" />
            ))}
        </div>
        {/* Row skeletons */}
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-bsg-surface-alt" />
        ))}
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const LeaderboardDisplay = ({ isActive }: { isActive: boolean }) => {
    const { participants, isLoading, error } = useLeaderboard();
    const userId = useUserStore((s) => s.userId);
    const lastGameEvent = useRoomStore((s) => s.lastGameEvent);

    // Backend already returns entries sorted by rank; treat them as sorted.
    const sorted = participants;
    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3);
    const isRoundEnded = lastGameEvent?.type === "round-end";
    const isYou = (participant: Participant) => !!userId && participant.id === userId;

    return (
        <div className={`h-full flex flex-col bg-bsg-bg ${isActive ? "" : "hidden"}`}>

            {/* Header */}
            <div className="text-center py-4 px-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
                <p className="text-[#aaaaaa] text-sm mt-1">
                    {isRoundEnded ? "Final Room Rankings" : "Current Room Rankings"}
                </p>
                <div className="mx-auto mt-2 w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#72ab1c] to-transparent" />
            </div>

            {/* Error banner */}
            {error && (
                <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/40 flex-shrink-0">
                    <p className="text-red-400 text-xs text-center">{error}</p>
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && sorted.length === 0 && <LeaderboardSkeleton />}

            {/* Empty state — shown when not loading and no entries */}
            {!isLoading && sorted.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-[#72ab1c]/30 blur-xl rounded-full" />
                        <div className="relative w-12 h-12 bg-bsg-dark rounded-full p-2 border border-[#72ab1c]/40 shadow-lg shadow-[#72ab1c]/20">
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
                    <p className="text-[#72ab1c] font-bold text-lg tracking-tight">No Rankings Yet!</p>
                    <p className="text-[#aaaaaa] text-sm mt-1">Scores appear once a round starts</p>
                    <div className="mt-3 w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#72ab1c] to-transparent" />
                </div>
            )}

            {/* Top-3 strip + ranked list */}
            {sorted.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0 px-4 pb-3">

                    {/* Top-3 strip */}
                    <div className="flex gap-2 flex-shrink-0">
                        {top3.map((player, index) => (
                            <TopPlayerCard
                                key={player.id}
                                rank={(index + 1) as 1 | 2 | 3}
                                participant={player}
                                isYou={isYou(player)}
                            />
                        ))}
                    </div>

                    {/* Remaining standings (4th place and below) */}
                    <div
                        className="flex-1 min-h-0 mt-2 pb-2 space-y-1.5 overflow-y-auto"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#72ab1c55 transparent" }}
                    >
                        {rest.map((player, index) => (
                            <RankRow
                                key={player.id}
                                rank={index + 4}
                                participant={player}
                                isYou={isYou(player)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
