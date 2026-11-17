import { useCallback, useMemo } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useStatistics } from '@/hooks/useStatistics';

export interface ProfileProblem {
    slug: string;
    solved: boolean; // this user has an accepted submission for it
}

export interface ParticipantProfile {
    rank: number | null; // position in the room; null = not on the leaderboard yet
    solvedCount: number; // how many of the round's problems this user completed
    problems: ProfileProblem[]; // one per problem, in round order (same order as the toolbar progress bar)
    score: number; // points earned in the round
}

/** Per-user data for the hover card in the Room tab. Call the returned function with a participant's id. */
export function useParticipantProfiles(): (userId: string) => ParticipantProfile {
    const { participants } = useLeaderboard(); // GET /rooms/:id/leaderboard -> rank + score
    const { roundDetails } = useStatistics(); // GET /rooms/:id/round-details -> problems + who solved what

    const standings = useMemo(() => {
        const byUser = new Map<string, { rank: number; score: number }>();
        participants.forEach((entry, i) => {
            byUser.set(entry.id, { rank: i + 1, score: entry.score }); // backend returns entries sorted by rank
        });
        return byUser;
    }, [participants]);

    return useCallback((userId: string): ParticipantProfile => {
        const solvedIds = new Set((roundDetails?.solvedProblems?.[userId] ?? []).map(s => s.problemId)); // solvedProblems is keyed by user auth id
        const problems = (roundDetails?.problems ?? []).map(problem => ({
            slug: problem.slug,
            solved: solvedIds.has(problem.id),
        }));
        const standing = standings.get(userId);

        return {
            rank: standing?.rank ?? null,
            solvedCount: problems.filter(p => p.solved).length,
            problems,
            score: standing?.score ?? 0,
        };
    }, [roundDetails, standings]);
}
