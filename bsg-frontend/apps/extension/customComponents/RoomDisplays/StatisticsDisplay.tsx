import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, TrendingUp, Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useStatistics } from '@/hooks/useStatistics';

const BSG_GREEN = '#72ab1c';
const BSG_GREEN_DIM = '#4d7a10';

const difficultyConfig = {
  Easy: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  Medium: { color: '#ffa500', bg: 'rgba(255,165,0,0.12)', border: 'rgba(255,165,0,0.35)' },
  Hard: { color: '#ff4d4d', bg: 'rgba(255,77,77,0.12)', border: 'rgba(255,77,77,0.35)' },
} as const;

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

const StatCard = ({ icon, label, value, valueColor = 'text-white', dim = false }: { icon: React.ReactNode; label: string; value: string | number; valueColor?: string; dim?: boolean }) => (
  <div className="bg-[#333333] rounded-xl p-2.5 border border-white/10 flex flex-col gap-1.5 relative overflow-hidden w-fit min-w-[80px]">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
    <div className="flex items-center gap-1.5">
      <span className={dim ? 'text-foreground/40' : 'text-primary'}>{icon}</span>
      <span className="text-[8px] text-foreground/50 uppercase tracking-widest font-medium">{label}</span>
    </div>
    <div className={`text-xl font-bold font-mono ${dim ? 'text-foreground/40' : valueColor}`}>{value}</div>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <Loader2 size={24} className="text-primary animate-spin" />
    <p className="text-foreground/50 text-xs">Loading statistics…</p>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <TrendingUp size={28} className="text-foreground/30" />
    <p className="text-foreground/50 text-xs text-center">
      No round data yet.<br />Stats will appear once a round starts.
    </p>
  </div>
);

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

export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {
  const { participants, isLoading, error } = useLeaderboard();
  const { statistics, roundDetails } = useStatistics();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(participants.length - 1, 0));
  const selected = participants[safeIdx] ?? null;

  const scoreChartData = participants.map((p) => ({
    username: p.username.length > 8 ? p.username.slice(0, 7) + '…' : p.username,
    score: p.score,
  }));

  const { solvedIds, totalTimeStr, timePerDifficulty } = useMemo(() => {
    const ids = new Set<number>();
    const timeDiff = { Easy: 0, Medium: 0, Hard: 0 };
    let tStr = '—';

    if (!selected || !roundDetails?.solvedProblems || !roundDetails?.roundStartTime) {
      return { solvedIds: ids, totalTimeStr: tStr, timePerDifficulty: timeDiff };
    }

    const solved = roundDetails.solvedProblems[selected.id] ?? [];
    if (solved.length === 0) {
      return { solvedIds: ids, totalTimeStr: tStr, timePerDifficulty: timeDiff };
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

    return { solvedIds: ids, totalTimeStr: tStr, timePerDifficulty: timeDiff };
  }, [selected, roundDetails]);

  const selectedSolvedIds = solvedIds;

  const problemTimeMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!selected || !roundDetails?.solvedProblems || !roundDetails?.roundStartTime) {
      return map;
    }
    const solved = roundDetails.solvedProblems[selected.id] ?? [];
    const sortedSolved = [...solved].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let lastTime = new Date(roundDetails.roundStartTime).getTime();
    for (const s of sortedSolved) {
      const t = new Date(s.timestamp).getTime();
      const durationSec = Math.max(0, Math.floor((t - lastTime) / 1000));
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      map.set(s.problemId, `${mins}m ${secs}s`);
      lastTime = t;
    }
    return map;
  }, [selected, roundDetails]);

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
    return (['Easy', 'Medium', 'Hard'] as const).map((diff) => ({
      name: diff,
      value: timePerDifficulty[diff],
      fill: difficultyConfig[diff].color,
      solvedCount: diffCounts[diff].solved,
    })).filter((d) => d.value > 0);
  }, [timePerDifficulty, diffCounts]);

  if (!isActive) {
    return <div className="hidden" />;
  }

  if (isLoading && participants.length === 0) {
    return <LoadingState />;
  }

  if (error && participants.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col items-center p-4 pt-3 gap-4">
      {/* Player Tabs */}
      <div className="w-full flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {participants.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${idx === selectedIdx
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-[#333333] text-foreground/60 border border-transparent hover:bg-[#444444]'
              }`}
          >
            {p.username}
          </button>
        ))}
      </div>

      <div className="w-full flex gap-4 justify-between">
        <div className="flex flex-col gap-2 text-base font-medium">
          Submission Details
          <div className="flex rounded-lg text-sm border border-bsg-border">
            <div className="flex flex-col gap-2 px-4 py-3 font-normal">
              Solve Time
              <div className="text-lg font-medium">{totalTimeStr}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatCard icon={<TrophyIcon size={10} color={BSG_GREEN} />} label="Points" value={(statistics?.score ?? 0).toLocaleString()} valueColor="text-primary" />
            <StatCard icon={<CheckCircle2 size={10} />} label="Solved" value={selected ? selectedSolvedIds.size : '—'} dim={!selected || selectedSolvedIds.size === 0} />
            <StatCard icon={<Clock size={10} />} label="Total Time" value={totalTimeStr} dim={totalTimeStr === '—'} />

            {diffCounts.Easy.total > 0 && (
              <StatCard icon={<div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: difficultyConfig.Easy.color }} />} label="Easy" value={`${diffCounts.Easy.solved}/${diffCounts.Easy.total}`} dim={diffCounts.Easy.solved === 0} />
            )}
            {diffCounts.Medium.total > 0 && (
              <StatCard icon={<div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: difficultyConfig.Medium.color }} />} label="Medium" value={`${diffCounts.Medium.solved}/${diffCounts.Medium.total}`} dim={diffCounts.Medium.solved === 0} />
            )}
            {diffCounts.Hard.total > 0 && (
              <StatCard icon={<div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: difficultyConfig.Hard.color }} />} label="Hard" value={`${diffCounts.Hard.solved}/${diffCounts.Hard.total}`} dim={diffCounts.Hard.solved === 0} />
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-[#333333] rounded-xl p-3 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-foreground/50 uppercase tracking-widest font-medium">Time Distribution</span>
          {pieData.length === 0 && <span className="text-[9px] text-foreground/40 border border-white/10 rounded px-1.5 py-0.5 font-mono">not tracked</span>}
        </div>
        <div className="flex items-center justify-center py-5">
          <div className="relative" style={{ width: 80, height: 80 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value" stroke="none" />
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <>
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#262626" strokeWidth="14" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#333333" strokeWidth="14" strokeDasharray="4 6" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] text-foreground/40 font-mono">—</span>
                </div>
              </>
            )}
          </div>
          <div className="ml-4 flex flex-col gap-2">
            {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
              const secs = timePerDifficulty[diff];
              const mins = Math.floor(secs / 60);
              const s = secs % 60;
              const timeStr = secs > 0 ? `${mins}m ${s}s` : '—';

              return (
                <div key={diff} className="flex items-center gap-2 text-[9px]">
                  <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: difficultyConfig[diff].color }} />
                  <span className="text-foreground/40">{diff}</span>
                  <span className="font-mono text-foreground/30 ml-auto">{timeStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <div className="flex gap-2 items-center text-sm text-foreground/60 font-medium">Problem Breakdown</div>
        <div className="flex flex-col rounded-lg border border-[#454545] overflow-hidden bg-[#333333]">
          {roundDetails?.problems?.map((p) => {
            const isSolved = selectedSolvedIds.has(p.id);
            const timeStr = problemTimeMap.get(p.id) || '—';
            return (
              <div key={p.id} className="flex justify-between items-center p-3 border-b border-white/10 last:border-0">
                <div className="flex items-center gap-3">
                  {isSolved ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-[10px]" style={{ color: difficultyConfig[p.difficulty as keyof typeof difficultyConfig]?.color }}>{p.difficulty}</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-foreground/60">
                  {isSolved ? timeStr : '—'}
                </div>
              </div>
            );
          })}
          {(!roundDetails?.problems || roundDetails.problems.length === 0) && (
            <div className="p-4 text-center text-xs text-foreground/50">No problems found</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <div className="flex gap-2 items-center text-sm text-foreground/60 font-medium">Room Statistics</div>
        <div className="flex flex-col rounded-lg border border-[#454545] overflow-hidden">
          <div className="p-4 overflow-x-auto">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={scoreChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="username" tickLine={false} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {scoreChartData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i === safeIdx ? BSG_GREEN : BSG_GREEN_DIM} style={i === safeIdx ? { filter: 'none' } : { opacity: 0.6 }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

