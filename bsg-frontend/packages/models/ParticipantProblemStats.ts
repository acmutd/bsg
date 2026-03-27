export type ParticipantProblemStats = {
    problemIndex: number
    problemId: number
    participantId: string

    runtimeMs: number
    runtimePercentile: number
    memoryKb: number
    memoryPercentile: number
    score: number
}