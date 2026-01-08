import React from "react";
import { ScrollArea } from "@bsg/ui/scroll-area";
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption
} from "@bsg/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@bsg/ui/avatar"

export type LeaderboardEntry = {
    id: string
    username: string
    score: number
    avatarUrl?: string
}

type LeaderboardProps = {
    entries: LeaderboardEntry[]
}

const Leaderboard = ({ entries }: LeaderboardProps) => {

    const sortedEntries = [...entries].sort((a, b) => b.score - a.score)

    return (
        <div className="rounded-lg overflow-hidden">
            <h2 className="flex h-12 text-base font-semibold justify-center items-center">Leaderboard</h2>
            <ScrollArea className="h-36">
                <Table>
                    <TableBody className="[&_tr:nth-child(odd)]:bg-muted/5 [&_tr:nth-child(odd):hover]:bg-muted/25 [&_tr:hover]:bg-muted/25">
                        {sortedEntries.map((entry, index) => (
                            <TableRow key={index} className="border-none">

                                {/* Rank */}
                                {index <= 2 && <TableCell className="px-4 py-0 text-lg">
                                    {index === 0 && "🥇"}
                                    {index === 1 && "🥈"}
                                    {index === 2 && "🥉"}
                                </TableCell>}
                                {index > 2 && <TableCell className="px-4 py-0 text-base">
                                    {index + 1 + "th"}
                                </TableCell>}

                                {/* User */}
                                <TableCell className="flex gap-2 p-3">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={entry.avatarUrl} />
                                        <AvatarFallback>
                                            {entry.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {entry.username}
                                </TableCell>

                                {/* Score */}
                                <TableCell className="p-3">{entry.score}</TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default Leaderboard;