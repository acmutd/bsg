import {columns, Submission} from "./columns";
import {DataTable} from "./data-table";

function getData(): Submission[] {
    // Fetch data here.
    return [
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Time Limit Exceeded",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Runtime Error",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        {
            id: "728ed52f",
            time_submitted: new Date().toLocaleString().slice(0, -3),
            status: "Accepted",
            runtime: 100,
            memory: 16.6,
            language: "Python3",
        },
        // ...
    ];
}

export default function SubmissionPage() {
    const data = getData();

    return (
        <div className="container mx-auto py-4">
            <DataTable columns={columns} data={data}/>
        </div>
    );
}
