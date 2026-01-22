import { Problem } from "./Problem"

export type Competition = {
    id: string
    problems: Problem[]
    durationMs: number
    ended: boolean
}