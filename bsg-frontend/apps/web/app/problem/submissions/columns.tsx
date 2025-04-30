"use client";

import {ColumnDef} from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Submission = {
    id: string;
    time_submitted: string;
    status: "Accepted" | "Runtime Error" | "Time Limit Exceeded" | "Wrong Answer";
    runtime: number;
    memory: number;
    language: "C++" | "Java" | "Python3";
};

export const columns: ColumnDef<Submission>[] = [
    {
        accessorKey: "time_submitted",
        header: "Time Submitted",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({row}) => {
            const status = row.getValue<string>("status");
            const color = status === "Accepted" ? "text-green-500" : "text-red-500";
            return <div className={`font-medium ${color}`}>{status}</div>;
        },
    },
    {
        accessorKey: "runtime",
        header: "Runtime",
        cell: ({row}) => {
            const runtime = parseInt(row.getValue("runtime"));
            return <div className="text-right font-medium">{runtime + " ms"}</div>;
        },
    },
    {
        accessorKey: "memory",
        header: "Memory",
        cell: ({row}) => {
            const memory = parseFloat(row.getValue("memory"));
            return <div className="text-right font-medium">{memory + " MB"}</div>;
        },
    },
    {
        accessorKey: "language",
        header: "Language",
    },
];
