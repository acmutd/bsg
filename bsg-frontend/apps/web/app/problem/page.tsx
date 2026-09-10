/* eslint-disable react/no-unescaped-entities */
"use client";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@bsg/ui/resizable";
import React, {useRef, useState} from "react";
import CodeMirror, {EditorView} from "@uiw/react-codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {vscodeDark} from "@uiw/codemirror-theme-vscode";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@bsg/ui/tabs";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";
import SubmissionPage from "./submissions/page";

const TAB_LIST = "h-auto gap-1 rounded-full border border-bsg-border bg-inputBackground/70 p-1";
const TAB_TRIGGER =
    "rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/60 transition-all duration-200 " +
    "data-[state=active]:bg-signal data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm";

const TestCase = ({input, output}: { input: string; output: string }) => (
    <div className="space-y-4">
        <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/45 mb-2">Input</p>
            <pre className="surface-panel overflow-x-auto rounded-xl px-4 py-3 font-mono text-sm text-foreground/90">
                {input}
            </pre>
        </div>
        <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/45 mb-2">Output</p>
            <pre className="surface-panel overflow-x-auto rounded-xl px-4 py-3 font-mono text-sm text-foreground/90">
                {output}
            </pre>
        </div>
    </div>
);

const Problem = () => {
    const [value, setValue] = useState(
        "console.log('hello world!');\n\n\n\n\n\n\n\n\n",
    );
    const editorRef = useRef<EditorView | null>(null);

    const sampleInput = '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]';
    const sampleOutput = '"ABCCED"';

    return (
        <div className="flex w-full h-[calc(100vh-72px)] px-3 pb-3 sm:px-4 sm:pb-4">
            <ResizablePanelGroup
                direction="horizontal"
                className="surface-panel flex-1 overflow-hidden rounded-2xl animate-fade-in"
            >
                <ResizablePanel maxSize={50} className="bg-bsg-surface/40">
                    <Tabs defaultValue="problem" className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-bsg-border px-4 py-3">
                            <TabsList className={TAB_LIST}>
                                <TabsTrigger className={TAB_TRIGGER} value="problem">Problem</TabsTrigger>
                                <TabsTrigger className={TAB_TRIGGER} value="submissions">Submissions</TabsTrigger>
                                <TabsTrigger className={TAB_TRIGGER} value="solutions">Solutions</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex-1 overflow-auto px-5 py-4">
                            <TabsContent value="problem" className="mt-0">
                                <p className="eyebrow mb-2">Problem</p>
                                <p className="display text-2xl mb-4">Problem Statement</p>
                            </TabsContent>
                            <TabsContent value="submissions" className="mt-0">
                                {/* Previous submissions */}
                                <SubmissionPage/>
                            </TabsContent>
                            <TabsContent value="solutions" className="mt-0 text-foreground/60">Solutions</TabsContent>
                        </div>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle={true} className="bg-bsg-border"/>
                <ResizablePanel defaultSize={50}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel
                            minSize={10}
                            maxSize={80}
                            onResize={() => {
                                // Adjust the CodeMirror editor size here if needed
                            }}>
                            <div className="flex h-full flex-col bg-bsg-dark">
                                <div className="flex items-center justify-between border-b border-bsg-border px-4 py-2.5">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/45">
                                        solution.js
                                    </span>
                                    <span className="font-mono text-[11px] text-foreground/35">JavaScript</span>
                                </div>
                                <div
                                    onClick={() => editorRef.current?.focus()}
                                    className="flex flex-1 min-h-0">
                                    <CodeMirror
                                        value={value}
                                        autoFocus={true}
                                        ref={editorRef}
                                        theme={vscodeDark}
                                        extensions={[javascript({jsx: true})]}
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle={true} className="bg-bsg-border"/>
                        <ResizablePanel defaultSize={75}>
                            <div className="flex h-full flex-col">
                                <div className="flex items-center gap-2.5 border-b border-bsg-border px-4 py-2.5">
                                    <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-signal"/>
                                    <p className="text-sm font-medium">Test Cases</p>
                                </div>
                                <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-auto p-5 sm:flex-row sm:items-start">
                                    <Tabs defaultValue="case1" className="flex-1 min-w-0">
                                        <TabsList className={TAB_LIST}>
                                            <TabsTrigger className={TAB_TRIGGER} value="case1">Case 1</TabsTrigger>
                                            <TabsTrigger className={TAB_TRIGGER} value="case2">Case 2</TabsTrigger>
                                            <TabsTrigger className={TAB_TRIGGER} value="case3">Case 3</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="case1" className="mt-5">
                                            <TestCase input={sampleInput} output={sampleOutput}/>
                                        </TabsContent>
                                        <TabsContent value="case2" className="mt-5">
                                            <TestCase input={sampleInput} output={sampleOutput}/>
                                        </TabsContent>
                                        <TabsContent value="case3" className="mt-5">
                                            <TestCase input={sampleInput} output={sampleOutput}/>
                                        </TabsContent>
                                    </Tabs>
                                    <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                                        <button
                                            type="button"
                                            className="btn-ghost inline-flex h-10 items-center rounded-full px-5 text-sm font-medium"
                                        >
                                            Run
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-signal inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default Problem;
