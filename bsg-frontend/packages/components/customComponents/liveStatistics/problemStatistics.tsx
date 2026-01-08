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
    TableCaption,
} from "@bsg/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@bsg/ui/avatar"

const ProblemStatistics = () => {
    return (
        <div className="flex flex-col p-4 gap-4 rounded-lg">

            {/* Problem Info */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                    <h2 className="text-base font-semibold">2. Add Two Numbers</h2>
                    <h2 className="text-sm font-semibold text-yellow-500">Medium</h2>
                </div>
                <div className="flex gap-2">
                    <div className="rounded-full px-2 py-1 bg-muted/10 text-xs">Linked List</div>
                    <div className="rounded-full px-2 py-1 bg-muted/10 text-xs">Math</div>
                    <div className="rounded-full px-2 py-1 bg-muted/10 text-xs">Recursion</div>
                </div>
            </div>
            
            {/* Problem Activity */}
            <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Solving (3)</h3>
                    <div className="flex gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Submitted (2)</h3>
                    <div className="flex gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            {/* Statistics Table */}
            <ScrollArea className="border rounded-lg">
            <Table className="text-xs">
                <TableHeader>
                    <TableRow className="border-none pointer-events-none">
                        <TableHead className="h-10 px-3"></TableHead>
                        <TableHead className="h-10 px-3">Solve Time</TableHead>
                        <TableHead className="h-10 px-3">Runtime (%)</TableHead>
                        <TableHead className="h-10 px-3">Memory (%)</TableHead>
                        <TableHead className="h-10 px-3">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(odd)]:bg-muted/5">
                    <TableRow className="border-none pointer-events-none">
                        <TableCell className="p-3">You</TableCell>
                        <TableCell className="p-3">--:--</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                    </TableRow>
                    <TableRow className="border-none pointer-events-none">
                        <TableCell className="p-3">Avg</TableCell>
                        <TableCell className="p-3">--:--</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                        <TableCell className="p-3">N/A</TableCell>
                    </TableRow>
                    <TableRow className="border-none pointer-events-none">
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
