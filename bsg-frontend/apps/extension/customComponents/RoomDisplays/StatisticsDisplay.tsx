import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import {
    Bar,
    BarChart,
    PieChart,
    Pie,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Cell,
} from "recharts";

// ─── BSG Color Tokens ─────────────────────────────────────────────────────────

const BSG_GREEN = "#72ab1c";
const BSG_GREEN_DIM = "#4d7a10";

import { roundProblems, players } from "./mockStatsData";


// ─── Difficulty config ────────────────────────────────────────────────────────

const difficultyConfig = {
    Easy: { color: BSG_GREEN, bg: "rgba(114,171,28,0.12)", border: "rgba(114,171,28,0.35)" },
    Medium: { color: "#ffa500", bg: "rgba(255,165,0,0.12)", border: "rgba(255,165,0,0.35)" },
    Hard: { color: "#ff4d4d", bg: "rgba(255,77,77,0.12)", border: "rgba(255,77,77,0.35)" },
} as const;

// ─── Trophy SVG (matches leaderboard branch design) ───────────────────────────

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

// ─── Player avatar with initials fallback (matches leaderboard branch) ────────

const PlayerAvatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
    const sizeMap = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
    return (
        <div
            className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-bold text-white border-2 border-[#72ab1c]/40 flex-shrink-0`}
            style={{ background: `linear-gradient(135deg, ${BSG_GREEN}, ${BSG_GREEN_DIM})` }}
        >
            {name[0]?.toUpperCase() ?? "?"}
        </div>
    );
};

// ─── Summary stat card ────────────────────────────────────────────────────────

const StatCard = ({
    icon, label, value, valueColor = "text-white",
}: {
    icon: React.ReactNode; label: string; value: string | number; valueColor?: string;
}) => (
    <div className="bg-[#141414] rounded-xl p-2.5 border border-[#2a2a2a] flex flex-col gap-1.5 relative overflow-hidden w-fit min-w-[80px]">
        {/* top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/25 to-transparent" />
        <div className="flex items-center gap-1.5">
            <span className="text-[#72ab1c]">{icon}</span>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-medium">{label}</span>
        </div>
        <div className={`text-xl font-bold font-mono ${valueColor}`}>{value}</div>
    </div>
);

// ─── Player selector button ───────────────────────────────────────────────────

const PlayerTab = ({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 whitespace-nowrap ${active
            ? "bg-[#72ab1c]/10 border-[#72ab1c] text-[#72ab1c]"
            : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#72ab1c]/40 hover:text-gray-200"
            }`}
        style={active ? { boxShadow: "0 0 14px rgba(114,171,28,0.25)" } : {}}
    >
        {name}
    </button>
);

// ─── Problem row card ─────────────────────────────────────────────────────────

const ProblemRow = ({
    problem,
    playerProblem,
}: {
    problem: typeof roundProblems[0];
    playerProblem: { solved: boolean; time: number; attempts: number; points: number } | undefined;
}) => {
    const isSolved = playerProblem?.solved ?? false;
    const cfg = difficultyConfig[problem.difficulty as keyof typeof difficultyConfig];

    return (
        <div
            className={`bg-[#141414] rounded-xl p-3 border transition-all duration-200 relative overflow-hidden ${isSolved ? "border-[#72ab1c]/25 hover:border-[#72ab1c]/45" : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                }`}
            style={isSolved ? { boxShadow: "inset 0 0 20px rgba(114,171,28,0.04)" } : {}}
        >
            {/* left accent stripe on solved */}
            {isSolved && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: `linear-gradient(to bottom, transparent, ${BSG_GREEN}, transparent)` }}
                />
            )}

            <div className="flex items-start gap-3 mb-2">
                {/* Status icon */}
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSolved
                        ? "bg-[#72ab1c]/10 border border-[#72ab1c]/30"
                        : "bg-[#1a1a1a] border border-[#2a2a2a]"
                        }`}
                    style={isSolved ? { boxShadow: "0 0 8px rgba(114,171,28,0.2)" } : {}}
                >
                    {isSolved
                        ? <CheckCircle2 size={15} className="text-[#72ab1c]" />
                        : <XCircle size={15} className="text-gray-600" />
                    }
                </div>

                {/* Problem info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className={`text-sm font-semibold ${isSolved ? "text-white" : "text-gray-500"}`}>
                            {problem.title}
                        </h3>
                        <span
                            className="text-[9px] px-2 py-0.5 rounded-full border font-medium tracking-wide"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                        >
                            {problem.difficulty}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                            <span className="text-gray-600">Time: </span>
                            <span className={`font-semibold ${isSolved ? "text-[#72ab1c]" : "text-gray-500"}`}>
                                {isSolved ? `${playerProblem?.time}m` : "—"}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Attempts: </span>
                            <span className={`font-semibold ${(playerProblem?.attempts ?? 0) > 2 ? "text-[#ffa500]" : "text-white"
                                }`}>
                                {playerProblem?.attempts ?? 0}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Points: </span>
                            <span className={`font-bold ${isSolved ? "text-[#72ab1c]" : "text-gray-500"}`}>
                                +{playerProblem?.points ?? 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Difficulty-colored progress bar */}
            {isSolved && playerProblem && (
                <div className="w-full bg-[#1e1e1e] rounded-full h-[3px] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.min((playerProblem.time / 20) * 100, 100)}%`,
                            backgroundColor: cfg.color,
                            boxShadow: `0 0 6px ${cfg.color}80`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(0);
    const [hoveredDiff, setHoveredDiff] = useState<string | null>(null);
    const player = players[selectedPlayer];

    const avgTime = player.solved > 0
        ? (player.problems.reduce((s, p) => s + p.time, 0) / player.solved).toFixed(1)
        : "0";

    // ── Time distribution donut data ──────────────────────────────────────────
    // Each slice = total minutes spent on solved problems of that difficulty.
    const timeByDiff = (diff: string) =>
        player.problems
            .filter((p, i) => roundProblems[i]?.difficulty === diff && p.solved)
            .reduce((s, p) => s + p.time, 0);

    const donutData = [
        { difficulty: "Easy", value: timeByDiff("Easy"), color: BSG_GREEN, glow: "rgba(114,171,28,0.6)" },
        { difficulty: "Medium", value: timeByDiff("Medium"), color: "#ffa500", glow: "rgba(255,165,0,0.6)" },
        { difficulty: "Hard", value: timeByDiff("Hard"), color: "#ff4d4d", glow: "rgba(255,77,77,0.6)" },
    ].filter(d => d.value > 0);

    const totalDonutTime = donutData.reduce((s, d) => s + d.value, 0);
    const timePerProblemChartData = player.problems.map((p, i) => ({
        name: `P${i + 1}`,
        time: p.time,
        solved: p.solved,
    }));
    const timePerProblemChartWidth = Math.max(timePerProblemChartData.length * 48, 240);

    // Problems shown when a slice is hovered
    const hoveredProblems = hoveredDiff
        ? roundProblems
            .map((rp, i) => ({ rp, pp: player.problems[i] }))
            .filter(({ rp, pp }) => rp.difficulty === hoveredDiff && pp?.solved)
        : [];

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
                            {roundProblems.length} Problems • 60 min time limit
                        </p>
                    </div>
                    <div className="mt-3 h-px bg-gradient-to-r from-[#72ab1c]/30 via-[#72ab1c]/10 to-transparent" />
                </div>

                {/* ── Player Selector ── */}
                <div
                    className="rounded-xl border border-[#72ab1c]/25 relative overflow-hidden flex flex-col"
                    style={{
                        background: "rgba(114,171,28,0.04)",
                        boxShadow: "0 0 0 1px rgba(114,171,28,0.08), 0 0 16px rgba(114,171,28,0.12), inset 0 0 12px rgba(114,171,28,0.04)",
                    }}
                >
                    <div
                        className="overflow-x-auto px-4 py-3 pb-2"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        <div className="flex gap-2 min-w-max">
                            {players.map((p, i) => (
                                <PlayerTab
                                    key={p.id}
                                    name={p.name}
                                    active={selectedPlayer === i}
                                    onClick={() => setSelectedPlayer(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Selected player header card ── */}
                <div
                    className="rounded-xl border border-[#72ab1c]/20 p-3 flex items-center gap-3"
                    style={{
                        background: "linear-gradient(135deg, rgba(114,171,28,0.07), rgba(114,171,28,0.03))",
                        boxShadow: "0 0 20px rgba(114,171,28,0.07)",
                    }}
                >
                    <PlayerAvatar name={player.name} size="lg" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{player.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Current round</p>
                    </div>
                    <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#72ab1c]/30 text-xs font-bold flex-shrink-0"
                        style={{ color: BSG_GREEN, background: "rgba(114,171,28,0.08)" }}
                    >
                        <TrophyIcon size={11} color={BSG_GREEN} />
                        #{selectedPlayer + 1}
                    </div>
                </div>

                {/* ── Summary Stats ── */}
                <div className="flex flex-wrap gap-2">
                    <StatCard
                        icon={<TrophyIcon size={10} color={BSG_GREEN} />}
                        label="Points"
                        value={player.totalPoints.toLocaleString()}
                        valueColor="text-[#72ab1c]"
                    />
                    <StatCard
                        icon={<CheckCircle2 size={10} />}
                        label="Solved"
                        value={`${player.solved}/${roundProblems.length}`}
                        valueColor="text-white"
                    />
                    <StatCard
                        icon={<Clock size={10} />}
                        label="Total Time"
                        value={player.totalTime}
                        valueColor="text-white"
                    />
                </div>

                {/* ── Time Distribution Donut ── */}
                <div
                    className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/20 to-transparent" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                        Time Distribution
                    </span>

                    <div className="flex items-start gap-3 mt-2">
                        {/* Donut */}
                        <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={28}
                                        outerRadius={48}
                                        paddingAngle={3}
                                        dataKey="value"
                                        onMouseEnter={(_: unknown, index: number) => setHoveredDiff(donutData[index]?.difficulty ?? null)}
                                        onMouseLeave={() => setHoveredDiff(null)}
                                        stroke="none"
                                    >
                                        {donutData.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.color}
                                                style={{
                                                    filter: `drop-shadow(0 0 6px ${entry.glow})`,
                                                    opacity: hoveredDiff && hoveredDiff !== entry.difficulty ? 0.35 : 1,
                                                    transition: "opacity 0.2s",
                                                    cursor: "pointer",
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <div
                                        className="text-base font-bold font-mono leading-none"
                                        style={{
                                            color: hoveredDiff
                                                ? (donutData.find(d => d.difficulty === hoveredDiff)?.color ?? BSG_GREEN)
                                                : BSG_GREEN
                                        }}
                                    >
                                        {hoveredDiff
                                            ? `${timeByDiff(hoveredDiff).toFixed(0)}m`
                                            : `${totalDonutTime.toFixed(0)}m`
                                        }
                                    </div>
                                    <div className="text-[8px] text-gray-500 mt-0.5">
                                        {hoveredDiff ?? "total"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right panel: legend + hover problem list */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                            {/* Legend rows */}
                            {donutData.map(d => (
                                <div
                                    key={d.difficulty}
                                    className="flex items-center justify-between text-[9px] cursor-default"
                                    onMouseEnter={() => setHoveredDiff(d.difficulty)}
                                    onMouseLeave={() => setHoveredDiff(null)}
                                    style={{ opacity: hoveredDiff && hoveredDiff !== d.difficulty ? 0.4 : 1, transition: "opacity 0.2s" }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: d.color, boxShadow: `0 0 4px ${d.glow}` }}
                                        />
                                        <span className="text-gray-400">{d.difficulty}</span>
                                    </div>
                                    <span className="font-mono font-semibold" style={{ color: d.color }}>
                                        {d.value.toFixed(1)}m
                                    </span>
                                </div>
                            ))}

                            {/* Hovered difficulty problem list */}
                            {hoveredDiff && hoveredProblems.length > 0 && (
                                <div
                                    className="mt-1.5 pt-1.5 border-t flex flex-col gap-1"
                                    style={{ borderColor: `${donutData.find(d => d.difficulty === hoveredDiff)?.color ?? BSG_GREEN}30` }}
                                >
                                    {hoveredProblems.map(({ rp, pp }) => (
                                        <div key={rp.id} className="flex items-center justify-between text-[9px]">
                                            <span className="text-gray-300 truncate pr-2">{rp.title}</span>
                                            <span
                                                className="font-mono font-semibold flex-shrink-0"
                                                style={{ color: donutData.find(d => d.difficulty === hoveredDiff)?.color }}
                                            >
                                                {pp?.time}m
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Problem breakdown section label ── */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                        Problem Breakdown
                    </span>
                    <div className="flex-1 h-px bg-[#2a2a2a]" />
                    <span className="text-[9px] text-[#72ab1c] font-mono font-semibold">
                        {player.solved}/{roundProblems.length} solved
                    </span>
                </div>

                {/* ── Problem rows ── */}
                <div className="flex flex-col gap-2">
                    {roundProblems.map(problem => (
                        <ProblemRow
                            key={problem.id}
                            problem={problem}
                            playerProblem={player.problems.find(p => p.id === problem.id)}
                        />
                    ))}
                </div>

                {/* ── Time per problem chart ── */}
                <div
                    className="rounded-xl border border-[#2a2a2a] p-3 relative overflow-hidden"
                    style={{ background: "linear-gradient(180deg, #141414 0%, #111 100%)" }}
                >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#72ab1c]/20 to-transparent" />

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
                            Time Per Problem
                        </span>
                        <div className="flex items-center gap-1">
                            <Zap size={12} className="text-[#72ab1c]" />
                            <span className="text-[12px] text-[#72ab1c] font-mono font-semibold">
                                Avg: {avgTime}m
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <BarChart
                            width={timePerProblemChartWidth}
                            height={110}
                            data={timePerProblemChartData}
                            barCategoryGap={0}
                            barSize={22}
                            margin={{ left: -14, right: 4, top: 2, bottom: 0 }}
                        >
                            <XAxis
                                dataKey="name"
                                stroke="#3a3a3a"
                                tick={{ fill: "#555", fontSize: 9 }}
                                axisLine={{ stroke: "#2f2f2f", strokeWidth: 1 }}
                                tickLine={false}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis
                                stroke="#3a3a3a"
                                tick={{ fill: "#555", fontSize: 9 }}
                                axisLine={false}
                                tickLine={false}
                                width={22}
                            />
                            <Bar dataKey="time" radius={[3, 3, 0, 0]}>
                                {player.problems.map((entry, i) => (
                                    <Cell
                                        key={`cell-${i}`}
                                        fill={entry.solved ? BSG_GREEN : "#2a2a2a"}
                                        style={
                                            entry.solved
                                                ? { filter: "drop-shadow(0 0 5px rgba(114,171,28,0.5))" }
                                                : {}
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </div>
                </div>

                {/* ── Difficulty summary tiles ── */}
                <div className="flex flex-wrap gap-2">
                    {(["Easy", "Medium", "Hard"] as const).map(diff => {
                        const cfg = difficultyConfig[diff];
                        const total = roundProblems.filter(p => p.difficulty === diff).length;
                        const solved = player.problems.filter((p, i) =>
                            roundProblems[i]?.difficulty === diff && p.solved
                        ).length;
                        const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

                        return (
                            <div
                                key={diff}
                                className="rounded-xl border p-3 relative overflow-hidden w-fit min-w-[72px]"
                                style={{ borderColor: cfg.border, background: cfg.bg }}
                            >
                                <div
                                    className="absolute top-0 left-0 right-0 h-px"
                                    style={{
                                        background: `linear-gradient(to right, transparent, ${cfg.color}55, transparent)`,
                                    }}
                                />
                                <span
                                    className="text-[9px] uppercase tracking-widest font-medium"
                                    style={{ color: cfg.color }}
                                >
                                    {diff}
                                </span>
                                <div
                                    className="text-2xl font-bold font-mono mt-0.5"
                                    style={{ color: cfg.color }}
                                >
                                    {solved}
                                    <span className="text-sm text-gray-600 font-normal">/{total}</span>
                                </div>
                                <div className="w-full bg-[#1e1e1e] rounded-full h-[3px] mt-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: cfg.color,
                                            boxShadow: `0 0 6px ${cfg.color}80`,
                                        }}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-600 mt-1">{pct}% solved</p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};