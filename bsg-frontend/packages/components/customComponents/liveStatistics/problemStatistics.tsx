import React from "react";
import { ScrollArea, ScrollBar } from "@bsg/ui/scroll-area";
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from "@bsg/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@bsg/ui/avatar"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { Participant } from "@bsg/models/Participant";
import { Problem } from "@bsg/models/Problem";

type ProblemStatisticsProps = {
    problem: Problem
    solving: Participant[]
    submitted: Participant[]
}

const ProblemStatistics = ({ problem, solving, submitted }: ProblemStatisticsProps) => {
    return (
        <div className="flex flex-col w-full p-4 gap-4 rounded-lg bg-muted/5">

            {/* Problem Info */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-4">
                    <h2 className="text-base font-semibold">
                        {problem.id}. {problem.title}
                    </h2>
                    {problem.difficulty == 0 && <h2 className="text-sm font-semibold text-green-500">Easy</h2>}
                    {problem.difficulty == 1 && <h2 className="text-sm font-semibold text-yellow-500">Medium</h2>}
                    {problem.difficulty == 2 && <h2 className="text-sm font-semibold text-red-500">Hard</h2>}
                </div>
                <div className="flex flex-wrap gap-1">
                    {problem.tags.map(tag => (
                        <div key={tag} className="rounded-full px-2 py-1 bg-muted/10 text-xs whitespace-nowrap">
                            {tag}
                        </div>
                    ))}
                </div>
            </div>

            {/* Problem Activity */}
            <div className="flex gap-4">
                <div className="flex flex-col w-1/2 gap-2">
                    <h3 className="text-sm font-medium whitespace-nowrap">Solving ({solving.length})</h3>
                    <ScrollArea>
                        <div className="flex flex-wrap gap-2">
                            {solving.map(participant =>
                                <Avatar className="h-6 w-6 max-h-22">
                                    <AvatarImage src={participant.avatarUrl} />
                                    <AvatarFallback color={participant.defaultColor}>
                                        {participant.username[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="flex flex-col w-1/2 gap-2">
                    <h3 className="text-sm font-medium whitespace-nowrap">Submitted ({submitted.length})</h3>
                    <ScrollArea>
                        <div className="flex flex-wrap gap-2 max-h-22">
                            {submitted.map(participant =>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={participant.avatarUrl} />
                                    <AvatarFallback color={participant.defaultColor}>
                                        {participant.username[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Statistics Table */}
            <ScrollArea className="border border-gray-700 rounded-lg">
                <Table className="text-xs">
                    <TableHeader>
                        <TableRow className="border-none pointer-events-none">
                            <TableHead className="h-10 px-2"></TableHead>
                            <TableHead className="h-10 px-2">Solve Time</TableHead>
                            <TableHead className="h-10 px-2">Runtime (%)</TableHead>
                            <TableHead className="h-10 px-2">Memory (%)</TableHead>
                            <TableHead className="flex flex-wrap items-center content-center gap-0.5 h-10 px-2">
                                Score
                                <FontAwesomeIcon icon={faCircleQuestion} />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:nth-child(odd)]:bg-muted/5">
                        <TableRow className="border-none pointer-events-none whitespace-nowrap">
                            <TableCell className="p-3">You</TableCell>
                            <TableCell className="p-3">--:--</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                        </TableRow>
                        <TableRow className="border-none pointer-events-none whitespace-nowrap">
                            <TableCell className="p-3">Avg</TableCell>
                            <TableCell className="p-3">--:--</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                        </TableRow>
                        <TableRow className="border-none pointer-events-none whitespace-nowrap">
                            <TableCell className="p-3">Best</TableCell>
                            <TableCell className="p-3">--:--</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                            <TableCell className="p-3">N/A</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default ProblemStatistics;
