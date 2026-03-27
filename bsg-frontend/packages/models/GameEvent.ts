export type GameEvent = {
    type: 'round-start' | 'next-problem' | 'round-end',
    data: any,
    timestamp: number
}