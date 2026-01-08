import React from 'react';
import ProblemStatistics from "./problemStatistics";
import Leaderboard, { LeaderboardEntry } from "./leaderboard";

type LiveStatisticsProps = {
    leaderboardData: LeaderboardEntry[]
}

const LiveStatistics = ( { leaderboardData }: LiveStatisticsProps ) => {
    return (
        <div className="flex flex-col p-4 gap-4">
            <ProblemStatistics/>
            <Leaderboard entries={leaderboardData}/>
        </div>
    )
}

export default LiveStatistics;