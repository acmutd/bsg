import { useMemo, useState } from "react";
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
    PieChart,
    Pie
} from "recharts";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useStatistics, type RoundProblem } from "@/hooks/useStatistics";
import { Participant } from "@bsg/models/Participant";

// ─── BSG Color Tokens ─────────────────────────────────────────────────────────

const BSG_GREEN = "#72ab1c";
const BSG_GREEN_DIM = "#4d7a10";

// ─── Difficulty config ────────────────────────────────────────────────────────

const difficultyConfig = {
    Easy: { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)" },
    Medium: { color: "#ffa500", bg: "rgba(255,165,0,0.12)", border: "rgba(255,165,0,0.35)" },
    Hard: { color: "#ff4d4d", bg: "rgba(255,77,77,0.12)", border: "rgba(255,77,77,0.35)" },
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
                className={`${sizeMap[size]} rounded-xl object-cover border-2 border-primary/40 flex-shrink-0`}
            />
        );
    }
    return (
        <div
            className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-bold text-white border-2 border-primary/40 flex-shrink-0`}
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
    <div className="bg-[#333333] rounded-xl p-2.5 border border-white/10 flex flex-col gap-1.5 relative overflow-hidden w-fit min-w-[80px]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="flex items-center gap-1.5">
            <span className={dim ? "text-foreground/40" : "text-primary"}>{icon}</span>
            <span className="text-[8px] text-foreground/50 uppercase tracking-widest font-medium">{label}</span>
        </div>
        <div className={`text-xl font-bold font-mono ${dim ? "text-foreground/40" : valueColor}`}>{value}</div>
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
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 whitespace-nowrap ${active
            ? "bg-primary/10 border-primary text-primary"
            : "bg-[#262626] border-white/10 text-foreground/60 hover:border-primary/40 hover:text-foreground"
            }`}
        style={active ? { boxShadow: "none" } : {}}
    >
        {name}
    </button>
);

// ─── "No data" badge ──────────────────────────────────────────────────────────

const NoDataBadge = () => (
    <span className="text-[9px] text-foreground/40 border border-white/10 rounded px-1.5 py-0.5 font-mono">
        not tracked
    </span>
);

// ─── Difficulty summary tile ──────────────────────────────────────────────────

const DiffTile = ({
    diff,
    cfg,
    solved = 0,
    total = 0,
}: {
    diff: "Easy" | "Medium" | "Hard";
    cfg: { color: string; bg: string; border: string };
    solved?: number;
    total?: number;
}) => {
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    const hasData = total > 0;
    return (
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
            <div className={`text-2xl font-bold font-mono mt-0.5 ${hasData ? "text-white" : "text-foreground/40"}`}>
                {hasData ? `${solved}/${total}` : "—"}
            </div>
            <div className="w-full bg-[#262626] rounded-full h-[3px] mt-2 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ backgroundColor: cfg.color, width: `${pct}%` }}
                />
            </div>
            {hasData ? (
                <p className="text-[9px] mt-1" style={{ color: cfg.color }}>{pct}%</p>
            ) : (
                <p className="text-[9px] text-foreground/40 mt-1">no data</p>
            )}
        </div>
    );
};

// ─── Custom score tooltip ─────────────────────────────────────────────────────

const ScoreTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#262626] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-foreground/60 mb-1">{label}</p>
            <p className="font-bold font-mono" style={{ color: BSG_GREEN }}>
                {payload[0].value.toLocaleString()} pts
            </p>
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const diff = data.name;
    const secs = data.value;
    const mins = Math.floor(secs / 60);
    const s = secs % 60;

    return (
        <div className="bg-[#262626] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
                <span className="font-bold text-white">{diff}</span>
            </div>
            <span className="text-foreground/60 font-mono">Time: {mins}m {s}s</span>
            <span className="text-foreground/50 font-mono">Solved: {data.solvedCount}</span>
        </div>
    );
};

// ─── Loading state ────────────────────────────────────────────────────────────

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 size={24} className="text-primary animate-spin" />
        <p className="text-foreground/50 text-xs">Loading statistics…</p>
    </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <TrendingUp size={28} className="text-foreground/30" />
        <p className="text-foreground/50 text-xs text-center">
            No round data yet.<br />Stats will appear once a round starts.
        </p>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {
    const { participants, isLoading, error } = useLeaderboard();
    const { statistics, roundDetails } = useStatistics();

    const [selectedIdx, setSelectedIdx] = useState(0);

    // Keep index in bounds if the participant list changes
    const safeIdx = Math.min(selectedIdx, Math.max(participants.length - 1, 0));
    const selected = participants[safeIdx] ?? null;

    // Build bar chart data from real leaderboard scores
    const scoreChartData = participants.map((p) => ({
        username: p.username.length > 8 ? p.username.slice(0, 7) + "…" : p.username,
        score: p.score,
    }));

    // Derive per-user solved problem info
    const { solvedIds, problemTimes, totalTimeStr, timePerDifficulty } = useMemo(() => {
        const ids = new Set<number>();
        const pTimes = new Map<number, string>();
        const timeDiff = { Easy: 0, Medium: 0, Hard: 0 };
        let tStr = "—";

        if (!selected || !roundDetails?.solvedProblems || !roundDetails?.roundStartTime) {
            return { solvedIds: ids, problemTimes: pTimes, totalTimeStr: tStr, timePerDifficulty: timeDiff };
        }

        const solved = roundDetails.solvedProblems[selected.id] ?? [];
        if (solved.length === 0) {
            return { solvedIds: ids, problemTimes: pTimes, totalTimeStr: tStr, timePerDifficulty: timeDiff };
        }

        const sortedSolved = [...solved].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const diffMap = new Map<number, string>();
        for (const p of roundDetails.problems ?? []) {
            diffMap.set(p.id, p.difficulty);
        }

        let lastTime = new Date(roundDetails.roundStartTime).getTime();
        let totalMs = 0;

        for (const s of sortedSolved) {
            ids.add(s.problemId);
            const t = new Date(s.timestamp).getTime();
            const durationSec = Math.max(0, Math.floor((t - lastTime) / 1000));
            const mins = Math.floor(durationSec / 60);
            const secs = durationSec % 60;
            pTimes.set(s.problemId, `${mins}m ${secs}s`);

            const d = diffMap.get(s.problemId);
            if (d) {
                const diffKey = (d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()) as keyof typeof timeDiff;
                if (timeDiff[diffKey] !== undefined) {
                    timeDiff[diffKey] += durationSec;
                }
            }

            totalMs += (t - lastTime);
            lastTime = t;
        }

        if (totalMs > 0) {
            const totalSec = Math.floor(totalMs / 1000);
            const tMins = Math.floor(totalSec / 60);
            const tSecs = totalSec % 60;
            tStr = `${tMins}m ${tSecs}s`;
        }

        return { solvedIds: ids, problemTimes: pTimes, totalTimeStr: tStr, timePerDifficulty: timeDiff };
    }, [selected, roundDetails]);

    const selectedSolvedIds = solvedIds;

    // Difficulty counts for the selected user in this round
    const diffCounts = useMemo(() => {
        const counts = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
        if (!roundDetails?.problems) return counts;
        for (const p of roundDetails.problems) {
            const key = (p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1).toLowerCase()) as keyof typeof counts;
            if (counts[key]) {
                counts[key].total++;
                if (selectedSolvedIds.has(p.id)) counts[key].solved++;
            }
        }
        return counts;
    }, [roundDetails, selectedSolvedIds]);

    const pieData = useMemo(() => {
        return (["Easy", "Medium", "Hard"] as const).map(diff => {
            return {
                name: diff,
                value: timePerDifficulty[diff],
                fill: difficultyConfig[diff].color,
                solvedCount: diffCounts[diff].solved
            };
        }).filter(d => d.value > 0);
    }, [timePerDifficulty, diffCounts]);

    return (
        <div className={`flex flex-col bg-background overflow-auto ${isActive ? "" : "hidden"}`}>
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
                            style={{ color: BSG_GREEN, textShadow: "none" }}
                        >
                            Round Performance
                        </h1>
                        <p className="text-foreground/50 text-xs mt-0.5">
                            {participants.length > 0
                                ? `${participants.length} participant${participants.length !== 1 ? "s" : ""}`
                                : "Awaiting participants"}
                        </p>
                    </div>
                    <div className="mt-3 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
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
                            className="rounded-xl border border-primary/25 relative overflow-hidden bg-[#333333]"
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
                                className="rounded-xl border border-primary/20 p-3 flex items-center gap-3 bg-[#333333]"
                            >
                                <PlayerAvatar participant={selected} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{selected.username}</p>
                                    <p className="text-foreground/50 text-xs mt-0.5">Current round</p>
                                </div>
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/30 text-xs font-bold flex-shrink-0"
                                    style={{ color: BSG_GREEN, background: "rgba(114,171,28,0.08)" }}
                                >
                                    <TrophyIcon size={11} color={BSG_GREEN} />
                                    #{safeIdx + 1}
                                </div>
                            </div>
                        )}

                        {/* ── Summary stat cards ── */}
                        <div className="flex flex-wrap gap-2">
                            {/* Score — from statistics endpoint */}
                            <StatCard
                                icon={<TrophyIcon size={10} color={BSG_GREEN} />}
                                label="Points"
                                value={(statistics?.score ?? 0).toLocaleString()}
                                valueColor="text-primary"
                            />
                            {/* Solved — from leaderboard data */}
                            <StatCard
                                icon={<CheckCircle2 size={10} />}
                                label="Solved"
                                value={selected ? selected.solvedCount : "—"}
                                dim={!selected || selected.solvedCount === 0}
                            />
                            <StatCard
                                icon={<Clock size={10} />}
                                label="Total Time"
                                value={totalTimeStr}
                                dim={totalTimeStr === "—"}
                            />
                        </div>

                        {/* ── Time distribution ── */}
                        <div className="bg-[#333333] rounded-xl p-3 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-foreground/50 uppercase tracking-widest font-medium">
                                    Time Distribution
                                </span>
                                {pieData.length === 0 && <NoDataBadge />}
                            </div>
                            <div className="flex items-center justify-center py-5">
                                <div className="relative" style={{ width: 80, height: 80 }}>
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={24}
                                                    outerRadius={38}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                />
                                                <Tooltip content={<PieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 80 80" className="w-full h-full">
                                                <circle cx="40" cy="40" r="28" fill="none" stroke="#262626" strokeWidth="14" />
                                                <circle
                                                    cx="40" cy="40" r="28" fill="none"
                                                    stroke="#333333" strokeWidth="14"
                                                    strokeDasharray="4 6"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[9px] text-foreground/40 font-mono">—</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="ml-4 flex flex-col gap-2">
                                    {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                                        const secs = timePerDifficulty[diff];
                                        const mins = Math.floor(secs / 60);
                                        const s = secs % 60;
                                        const timeStr = secs > 0 ? `${mins}m ${s}s` : "—";
                                        return (
                                            <div key={diff} className="flex items-center gap-2 text-[9px]">
                                                <div
                                                    className="w-2 h-2 rounded-full opacity-30"
                                                    style={{ backgroundColor: difficultyConfig[diff].color }}
                                                />
                                                <span className="text-foreground/40">{diff}</span>
                                                <span className="font-mono text-foreground/30 ml-auto">{timeStr}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Problem breakdown ── */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-foreground/50 uppercase tracking-widest font-medium">
                                Problem Breakdown
                            </span>
                            <div className="flex-1 h-px bg-white/10" />
                            {roundDetails?.problems && roundDetails.problems.length > 0 ? (
                                <span className="text-[9px] text-foreground/50 font-mono">
                                    {selectedSolvedIds.size}/{roundDetails.problems.length}
                                </span>
                            ) : (
                                <NoDataBadge />
                            )}
                        </div>

                        {roundDetails?.problems && roundDetails.problems.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {roundDetails.problems.map((problem) => {
                                    const isSolved = selectedSolvedIds.has(problem.id);
                                    const diffKey = (problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1).toLowerCase()) as keyof typeof difficultyConfig;
                                    const cfg = difficultyConfig[diffKey] ?? difficultyConfig.Medium;
                                    return (
                                        <div
                                            key={problem.id}
                                             className={`bg-[#333333] rounded-xl p-3 border relative overflow-hidden transition-all duration-300 ${isSolved
                                                ? "border-primary/30"
                                                : "border-white/10"
                                                }`}
                                            style={isSolved ? { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" } : {}}
                                        >
                                            {isSolved && (
                                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                                            )}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${isSolved
                                                        ? "border-primary/40 bg-primary/10"
                                                        : "border-white/10 bg-[#262626]"
                                                        }`}
                                                >
                                                    {isSolved ? (
                                                        <CheckCircle2 size={14} className="text-primary" />
                                                    ) : (
                                                        <span className="text-[10px] text-foreground/40 font-mono">?</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium truncate ${isSolved ? "text-white" : "text-foreground/60"}`}>
                                                        {problem.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span
                                                            className="text-[9px] font-medium uppercase"
                                                            style={{ color: cfg.color }}
                                                        >
                                                            {problem.difficulty}
                                                        </span>
                                                        {isSolved && (
                                                            <span className="text-[9px] text-primary font-medium">
                                                                Solved ✓ {problemTimes.has(problem.id) ? `(${problemTimes.get(problem.id)})` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map((n) => (
                                    <div
                                        key={n}
                                        className="bg-[#333333] rounded-xl p-3 border border-white/10 opacity-40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#262626] border border-white/10 flex-shrink-0" />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="h-3 w-28 rounded bg-[#333333]" />
                                                <div className="h-2 w-20 rounded bg-[#262626]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[9px] text-foreground/40 text-center">
                                    Problem data will appear once a round starts
                                </p>
                            </div>
                        )}

                        {/* ── Room score comparison (real leaderboard data) ── */}
                        <div
                            className="rounded-xl border border-white/10 p-3 relative overflow-hidden bg-[#333333]"
                        >
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] text-foreground/50 uppercase tracking-widest font-medium">
                                    Room Score Comparison
                                </span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-[9px] text-foreground/50">live data</span>
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
                                        <CartesianGrid vertical={false} stroke="#262626" />
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
                                            width={35}
                                            allowDecimals={false}
                                            label={{ value: 'Points', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 9, offset: 5 }}
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
                                                            ? { filter: "none" }
                                                            : { opacity: 0.6 }
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Scoring formula hint */}
                            <p className="text-[9px] text-foreground/30 mt-2 text-center font-mono">
                                Score = BasePoints × e<sup>−0.001 × runtime(ms)</sup>
                            </p>
                        </div>

                        {/* ── Difficulty tiles (per-round data) ── */}
                        <div className="flex flex-wrap gap-2">
                            {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                                <DiffTile
                                    key={diff}
                                    diff={diff}
                                    cfg={difficultyConfig[diff]}
                                    solved={diffCounts[diff].solved}
                                    total={diffCounts[diff].total}
                                />
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};