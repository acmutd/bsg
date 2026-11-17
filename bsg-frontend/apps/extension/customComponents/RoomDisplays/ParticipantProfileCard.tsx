import type { ParticipantProfile } from '@/hooks/useParticipantProfiles';

const GREEN = '#62AF2E'; // same green as the toolbar progress bar
const GREY = 'rgb(var(--foreground) / 0.25)';

/** Contents of the hover card for one participant: rank, solved count, per-problem circles, points. */
export const ParticipantProfileCard = ({ profile }: { profile: ParticipantProfile }) => {
    const { rank, solvedCount, problems, score } = profile;

    const divider = <div className="min-w-[1px] h-3 bg-bsg-separator" />; // same thin separator the tab bar uses

    return (
        <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-foreground whitespace-nowrap">
            <div>{rank === null ? '—' : `# ${rank}`}</div> {/* rank in the room; dash until they are on the leaderboard */}

            {divider}

            <div>{solvedCount} / {problems.length} solved</div> {/* problems completed out of the round's total */}

            {divider}

            {problems.length > 0 && (
                <>
                    <div className="flex items-center gap-1">
                        {problems.map((problem, i) => (
                            <div
                                key={`${problem.slug}-${i}`}
                                title={problem.slug}
                                className="h-2 w-2 rounded-full border-[0.5px]"
                                style={{
                                    backgroundColor: problem.solved ? GREEN : 'transparent', // filled = solved, outline = not solved
                                    borderColor: problem.solved ? GREEN : GREY,
                                }}
                            />
                        ))}
                    </div>

                    {divider} {/* only drawn when there are circles, so two lines never sit side by side */}
                </>
            )}

            <div>{score} points</div> {/* points earned in the round */}
        </div>
    );
};
