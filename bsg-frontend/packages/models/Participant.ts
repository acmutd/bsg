export type Participant = {
    id: string
    username: string
    avatarUrl?: string
    defaultColor: string
    currentProblemIndex: number | null
    score: number
}