import { useState } from "react";
import { CheckCircle2, Clock, TrendingUp, Loader2 } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useStatistics } from "@/hooks/useStatistics";
import { Participant } from "@bsg/models/Participant";

// ─── BSG Color Tokens ─────────────────────────────────────────────────────────

const BSG_GREEN = "#72ab1c";
const BSG_GREEN_DIM = "#4d7a10";

// ─── Difficulty config ────────────────────────────────────────────────────────

const difficultyConfig = {
    Easy:   { color: BSG_GREEN,  bg: "rgba(114,171,28,0.12)", border: "rgba(114,171,28,0.35)" },
    Medium: { color: "#ffa500",  bg: "rgba(255,165,0,0.12)",  border: "rgba(255,165,0,0.35)"  },
    Hard:   { color: "#ff4d4d",  bg: "rgba(255,77,77,0.12)",  border: "rgba(255,77,77,0.35)"  },
} as const;

// ─── Trophy SVG ───────────────────────────────────────────────────────────────

const TrophyIcon = ({ size = 12, color = BSG_GREEN }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// ─── Player avatar ────────────────────────────────────────────────────────────

const PlayerAvatar = ({
    participant,
    size = "md",
}: {
    participant: Participant;
    size?: "sm" | "md" | "lg";
}) => {
    const sizeMap = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
    if (participant.avatarUrl) {
        return (
            <img
                src={participant.avatarUrl}
                alt={participant.username}
                className={`${sizeMap[size]} rounded-xl object-cover border-2 border-[#72ab1c]/40 flex-shrink-0`}
            />
        );
    }
    return (
        <div
            className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-bold text-white border-2 border-[#72ab1c]/40 flex-shrink-0`}
            style={{ background: `linear-gradient(135deg, ${BSG_GREEN}, ${BSG_GREEN_DIM})` }}
        >
            {participant.username[0]?.toUpperCase() ?? "?"}
        </div>
    );
};

// ─── Summary stat card ────────────────────────────────────────────────────────

const StatCard = ({
    icon, label, value, valueColor = "text-white", dim = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor?: string;
    dim?: boolean;
}) => (
    <div className="bg-[#141414] rounded-xl p-2.5 border border-[#2a2a2a] flex flex-col gap-1.5 relative overflow-hidden w-fit min-w-[80px]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/25 to-transparent" />
        <div className="flex items-center gap-1.5">
            <span className={dim ? "text-gray-600" : "text-[#72ab1c]"}>{icon}</span>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-medium">{label}</span>
        </div>
        <div className={`text-xl font-bold font-mono ${dim ? "text-gray-600" : valueColor}`}>{value}</div>
    </div>
);

// ─── Player selector button ───────────────────────────────────────────────────

const PlayerTab = ({
    name, active, onClick,
}: {
    name: string; active: boolean; onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
            active
                ? "bg-[#72ab1c]/10 border-[#72ab1c] text-[#72ab1c]"
                : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#72ab1c]/40 hover:text-gray-200"
        }`}
        style={active ? { boxShadow: "0 0 14px rgba(114,171,28,0.25)" } : {}}
    >
        {name}
    </button>
);

// ─── "No data" badge ──────────────────────────────────────────────────────────

const NoDataBadge = () => (
    <span className="text-[9px] text-gray-600 border border-[#2a2a2a] rounded px-1.5 py-0.5 font-mono">
        not tracked
    </span>
);

// ─── Difficulty summary tile (placeholder) ────────────────────────────────────

const DiffTile = ({
    diff,
    cfg,
}: {
    diff: "Easy" | "Medium" | "Hard";
    cfg: { color: string; bg: string; border: string };
}) => (
    <div
        className="rounded-xl border p-3 relative overflow-hidden w-fit min-w-[72px]"
        style={{ borderColor: cfg.border, background: cfg.bg }}
    >
        <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${cfg.color}55, transparent)` }}
        />
        <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: cfg.color }}>
            {diff}
        </span>
        <div className="text-2xl font-bold font-mono mt-0.5 text-gray-600">—</div>
        <div className="w-full bg-[#1e1e1e] rounded-full h-[3px] mt-2 overflow-hidden">
            <div className="h-full w-0 rounded-full" style={{ backgroundColor: cfg.color }} />
        </div>
        <p className="text-[9px] text-gray-600 mt-1">no data</p>
    </div>
);

// ─── Custom score tooltip ─────────────────────────────────────────────────────

const ScoreTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-gray-400 mb-1">{label}</p>
            <p className="font-bold font-mono" style={{ color: BSG_GREEN }}>
                {payload[0].value.toLocaleString()} pts
            </p>
        </div>
    );
};

// ─── Loading state ────────────────────────────────────────────────────────────

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 size={24} className="text-[#72ab1c] animate-spin" />
        <p className="text-gray-500 text-xs">Loading statistics…</p>
    </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <TrendingUp size={28} className="text-gray-700" />
        <p className="text-gray-500 text-xs text-center">
            No round data yet.<br />Stats will appear once a round starts.
        </p>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {
    const { participants, isLoading, error } = useLeaderboard();
    const { statistics } = useStatistics();

    const [selectedIdx, setSelectedIdx] = useState(0);

    // Keep index in bounds if the participant list changes
    const safeIdx = Math.min(selectedIdx, Math.max(participants.length - 1, 0));
    const selected = participants[safeIdx] ?? null;

    // Build bar chart data from real leaderboard scores
    const scoreChartData = participants.map((p) => ({
        username: p.username.length > 8 ? p.username.slice(0, 7) + "…" : p.username,
        score: p.score,
    }));

    return (
        <div className={`flex flex-col bg-[#0e0e0e] overflow-auto ${isActive ? "" : "hidden"}`}>
            <div className="min-h-full p-4 flex flex-col gap-4">

                {/* ── Header ── */}
                <div className="relative">
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
                        style={{ background: `linear-gradient(to bottom, transparent, ${BSG_GREEN}, transparent)` }}
                    />
                    <div className="pl-3">
                        <h1
                            className="text-lg font-bold tracking-tight"
                            style={{ color: BSG_GREEN, textShadow: `0 0 18px ${BSG_GREEN}55` }}
                        >
                            Round Performance
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {participants.length > 0
                                ? `${participants.length} participant${participants.length !== 1 ? "s" : ""}`
                                : "Awaiting participants"}
                        </p>
                    </div>
                    <div className="mt-3 h-px bg-gradient-to-r from-[#72ab1c]/30 via-[#72ab1c]/10 to-transparent" />
                </div>

                {/* ── Loading / Error / Empty ── */}
                {isLoading && participants.length === 0 && <LoadingState />}

                {error && (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-400">
                        {error}
                    </div>
                )}

                {!isLoading && !error && participants.length === 0 && <EmptyState />}

                {/* ── Main content — only shown with participants ── */}
                {participants.length > 0 && (
                    <>
                        {/* ── Player selector ── */}
                        <div
                            className="rounded-xl border border-[#72ab1c]/25 relative overflow-hidden"
                            style={{
                                background: "rgba(114,171,28,0.04)",
                                boxShadow: "0 0 0 1px rgba(114,171,28,0.08), 0 0 16px rgba(114,171,28,0.12), inset 0 0 12px rgba(114,171,28,0.04)",
                            }}
                        >
                            <div className="overflow-x-auto px-4 py-3 pb-2" style={{ scrollbarWidth: "thin" }}>
                                <div className="flex gap-2 min-w-max">
                                    {participants.map((p, i) => (
                                        <PlayerTab
                                            key={p.id}
                                            name={p.username}
                                            active={safeIdx === i}
                                            onClick={() => setSelectedIdx(i)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Selected player card ── */}
                        {selected && (
                            <div
                                className="rounded-xl border border-[#72ab1c]/20 p-3 flex items-center gap-3"
                                style={{
                                    background: "linear-gradient(135deg, rgba(114,171,28,0.07), rgba(114,171,28,0.03))",
                                    boxShadow: "0 0 20px rgba(114,171,28,0.07)",
                                }}
                            >
                                <PlayerAvatar participant={selected} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{selected.username}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Current round</p>
                                </div>
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#72ab1c]/30 text-xs font-bold flex-shrink-0"
                                    style={{ color: BSG_GREEN, background: "rgba(114,171,28,0.08)" }}
                                >
                                    <TrophyIcon size={11} color={BSG_GREEN} />
                                    #{safeIdx + 1}
                                </div>
                            </div>
                        )}

                        {/* ── Summary stat cards ── */}
                        <div className="flex flex-wrap gap-2">
                            {/* Score — real data from leaderboard */}
                            <StatCard
                                icon={<TrophyIcon size={10} color={BSG_GREEN} />}
                                label="Points"
                                value={selected ? selected.score.toLocaleString() : "—"}
                                valueColor="text-[#72ab1c]"
                            />
                            {/* Solved / Time — no backend data yet */}
                            <StatCard
                                icon={<CheckCircle2 size={10} />}
                                label="Solved"
                                value="—"
                                dim
                            />
                            <StatCard
                                icon={<Clock size={10} />}
                                label="Total Time"
                                value="—"
                                dim
                            />
                        </div>

                        {/* ── Time distribution (placeholder — no backend data) ── */}
                        <div className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/20 to-transparent" />
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                                    Time Distribution
                                </span>
                                <NoDataBadge />
                            </div>
                            <div className="flex items-center justify-center py-5">
                                <div className="relative" style={{ width: 80, height: 80 }}>
                                    <svg viewBox="0 0 80 80" className="w-full h-full">
                                        <circle cx="40" cy="40" r="28" fill="none" stroke="#1e1e1e" strokeWidth="14" />
                                        <circle
                                            cx="40" cy="40" r="28" fill="none"
                                            stroke="#2a2a2a" strokeWidth="14"
                                            strokeDasharray="4 6"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[9px] text-gray-600 font-mono">—</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex flex-col gap-2">
                                    {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                                        <div key={diff} className="flex items-center gap-2 text-[9px]">
                                            <div
                                                className="w-2 h-2 rounded-full opacity-30"
                                                style={{ backgroundColor: difficultyConfig[diff].color }}
                                            />
                                            <span className="text-gray-600">{diff}</span>
                                            <span className="font-mono text-gray-700 ml-auto">—</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Problem breakdown (placeholder — no backend data) ── */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                                Problem Breakdown
                            </span>
                            <div className="flex-1 h-px bg-[#2a2a2a]" />
                            <NoDataBadge />
                        </div>

                        <div className="flex flex-col gap-2">
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] opacity-40"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex-shrink-0" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="h-3 w-28 rounded bg-[#222]" />
                                            <div className="h-2 w-20 rounded bg-[#1e1e1e]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <p className="text-[9px] text-gray-600 text-center">
                                Per-problem breakdown requires additional backend data
                            </p>
                        </div>

                        {/* ── Room score comparison (real leaderboard data) ── */}
                        <div
                            className="rounded-xl border border-[#2a2a2a] p-3 relative overflow-hidden"
                            style={{ background: "linear-gradient(180deg, #141414 0%, #111 100%)" }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/20 to-transparent" />

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                                    Room Score Comparison
                                </span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BSG_GREEN }} />
                                    <span className="text-[9px] text-gray-500">live data</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <ResponsiveContainer width="100%" height={120}>
                                    <BarChart
                                        data={scoreChartData}
                                        barCategoryGap={0}
                                        barSize={22}
                                        margin={{ left: -14, right: 4, top: 2, bottom: 0 }}
                                    >
                                        <CartesianGrid vertical={false} stroke="#1e1e1e" />
                                        <XAxis
                                            dataKey="username"
                                            stroke="#3a3a3a"
                                            tick={{ fill: "#555", fontSize: 9 }}
                                            axisLine={{ stroke: "#2f2f2f", strokeWidth: 1 }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#3a3a3a"
                                            tick={{ fill: "#555", fontSize: 9 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={28}
                                        />
                                        <Tooltip
                                            content={<ScoreTooltip />}
                                            cursor={{ fill: "rgba(114,171,28,0.05)" }}
                                        />
                                        <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                                            {scoreChartData.map((_, i) => (
                                                <Cell
                                                    key={`cell-${i}`}
                                                    fill={i === safeIdx ? BSG_GREEN : BSG_GREEN_DIM}
                                                    style={
                                                        i === safeIdx
                                                            ? { filter: "drop-shadow(0 0 5px rgba(114,171,28,0.5))" }
                                                            : { opacity: 0.6 }
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Scoring formula hint */}
                            <p className="text-[9px] text-gray-700 mt-2 text-center font-mono">
                                Score = BasePoints × e<sup>−0.001 × runtime(ms)</sup>
                            </p>
                        </div>

                        {/* ── Difficulty tiles (placeholder — no backend data) ── */}
                        <div className="flex flex-wrap gap-2">
                            {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                                <DiffTile key={diff} diff={diff} cfg={difficultyConfig[diff]} />
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};