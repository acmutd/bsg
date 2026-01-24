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
import { Participant } from "@bsg/models/Participant"

type LeaderboardProps = {
    participants: Participant[]
}

const Leaderboard = ({ participants }: LeaderboardProps) => {

    const sortedEntries = [...participants].sort((a, b) => b.score - a.score)

    return (
        <div className="w-full rounded-lg overflow-hidden bg-neutral-750">
            <h2 className="flex h-12 text-base font-semibold justify-center items-center">Leaderboard</h2>
            <ScrollArea className="h-36">
                <Table>
                    <TableBody className="[&_tr:nth-child(odd)]:bg-neutral-700 [&_tr:nth-child(odd):hover]:bg-neutral-600 [&_tr:hover]:bg-neutral-600">
                        {sortedEntries.map((participant, i) => (
                            <TableRow key={participant.id} className="border-none">

                                {/* Rank */}
                                {i <= 2 && <TableCell className="px-4 py-0 text-lg">
                                    {i == 0 && "🥇"}
                                    {i == 1 && "🥈"}
                                    {i == 2 && "🥉"}
                                </TableCell>}
                                {i > 2 && <TableCell className="px-4 py-0 text-base">
                                    {i + 1 + "th"}
                                </TableCell>}

                                {/* User */}
                                <TableCell className="flex gap-2 p-3">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={participant.avatarUrl} />
                                        <AvatarFallback color={participant.defaultColor}>
                                            {participant.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {participant.username}
                                </TableCell>

                                {/* Score */}
                                <TableCell className="p-3">{participant.score}</TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default Leaderboard;