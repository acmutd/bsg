export type GameEvent = {
    type: 'round-start' | 'next-problem' | 'round-end' | 'join-round',
    data: any,
    timestamp: number
}