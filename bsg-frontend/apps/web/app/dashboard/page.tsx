"use client";
import React from "react";
import SearchBar from "@bsg/components/searchbar/searchbar";
import DifficultyDropdown from "@bsg/components/difficultyDropdown/difficultyDropdown";
import Difficulty from "@bsg/models/Difficulty";
import Topic from "@bsg/components/Topic/Topic";
import TopicList from "@bsg/components/TopicList";
import RoomItem from "@bsg/components/roomList/roomItem";
import RoomList from "@bsg/components/roomList/roomList";
import ProblemList from "@bsg/components/problemList/problemList";
import problemItem from "@bsg/components/problemList/problemItem";
import QuickStart from "@bsg/components/quickStart/quickStart";

const Dashboard = () => {
    const [difficulty, setDifficulty] = React.useState<Difficulty>(
        Difficulty.Easy,
    );
    const [problemPage, setProblemPage] = React.useState(0);
    const [tagsQuery, setTagsQuery] = React.useState("");
    const [remoteProblemList, setRemoteProblemList] = React.useState<any[] | null>(null);

    const topics: Topic[] = [
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
    ];
    const roomList: RoomItem[] = [
        {
            id: "1",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "2",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "3",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "4",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "5",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "6",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "7",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "8",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "9",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "10",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
    ];
    const problemList: problemItem[] = [
        {
            id: "1",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "2",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Medium,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "3",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Hard,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "4",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "5",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "6",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "7",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "8",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "9",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "10",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "11",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "12",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "13",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "14",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "15",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "16",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "17",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
    ];
    // dummy data

    const selectedTags = React.useMemo(
        () =>
            tagsQuery
                .split(",")
                .map((tag) => tag.trim().toLowerCase())
                .filter((tag) => tag.length > 0),
        [tagsQuery],
    );

    React.useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({count: "100", offset: "0"});
        if (selectedTags.length > 0) {
            params.set("tags", selectedTags.join(","));
        }

        const fetchProblems = async () => {
            try {
                const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://api.binarysearchgang.com";
                const response = await fetch(`${serverUrl}/problems?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    setRemoteProblemList(null);
                    return;
                }

                const payload = await response.json();
                const remoteProblems = (payload?.data ?? []).map((problem: any) => {
                    const difficulty =
                        problem?.difficulty === Difficulty.Easy ||
                        problem?.difficulty === Difficulty.Medium ||
                        problem?.difficulty === Difficulty.Hard
                            ? problem.difficulty
                            : Difficulty.Medium;

                    return {
                        id: String(problem?.id ?? ""),
                        name: String(problem?.name ?? ""),
                        acceptance: 0,
                        difficulty,
                        tags: Array.isArray(problem?.tags) ? problem.tags : [],
                        topic: Array.isArray(problem?.tags) && problem.tags.length > 0 ? problem.tags[0] : "",
                        description: "",
                    };
                });

                setRemoteProblemList(remoteProblems);
            } catch {
                if (!controller.signal.aborted) {
                    setRemoteProblemList(null);
                }
            }
        };

        fetchProblems();
        return () => controller.abort();
    }, [selectedTags]);

    const filteredProblemList = React.useMemo(() => {
        const list = remoteProblemList ?? problemList;

        if (selectedTags.length === 0) {
            return list;
        }

        return list.filter((problem) => {
            const problemTags = [
                ...(problem.tags ?? []),
                ...(problem.topic ? [problem.topic] : []),
            ].map((tag) => tag.toLowerCase());

            return selectedTags.every((tag) => problemTags.includes(tag));
        });
    }, [problemList, remoteProblemList, selectedTags]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <header className="reveal mb-8 space-y-2" style={{"--i": 0} as React.CSSProperties}>
                <p className="eyebrow">Dashboard</p>
                <h1 className="display text-[clamp(2rem,4vw,3rem)]">Pick a problem. Start a room.</h1>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="min-w-0 flex flex-col gap-6">
                    <div className="reveal flex flex-wrap items-center gap-2" style={{"--i": 1} as React.CSSProperties}>
                        <SearchBar
                            value={tagsQuery}
                            onChange={(event) => setTagsQuery(event.target.value)}
                            placeholder={"Filter by tags (e.g. Array, Hash Table)"}
                        />
                        <DifficultyDropdown position={difficulty} setPosition={setDifficulty}/>
                        <QuickStart/>
                    </div>
                    <div className="reveal" style={{"--i": 2} as React.CSSProperties}>
                        <TopicList topics={topics}/>
                    </div>
                    <div className="reveal" style={{"--i": 3} as React.CSSProperties}>
                        <ProblemList problemList={filteredProblemList} page={problemPage}/>
                    </div>
                </div>
                <aside className="reveal lg:sticky lg:top-24" style={{"--i": 2} as React.CSSProperties}>
                    <RoomList roomList={roomList}/>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
