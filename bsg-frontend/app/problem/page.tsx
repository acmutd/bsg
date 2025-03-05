"use client";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import React, {useRef, useState} from "react";
import CodeMirror from "@uiw/react-codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {vscodeDark} from "@uiw/codemirror-theme-vscode";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";
import SubmissionPage from "./submissions/page";

const Problem = () => {
    const [value, setValue] = useState(
        "console.log('hello world!');\n\n\n\n\n\n\n\n\n",
    );
    const editorRef = useRef();

    return (
        <div className="flex w-full h-full flex-1 contents">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel maxSize={50} className={"bg-editorBackground"}>
                    <Tabs
                        defaultValue="problem"
                        className="flex-1 w-fit bg-inputBackground">
                        <TabsList className={"bg-inputBackground"}>
                            <TabsTrigger value="problem">Problem</TabsTrigger>
                            <TabsTrigger value="submissions">Submissions</TabsTrigger>
                            <TabsTrigger value="solutions">Solutions</TabsTrigger>
                        </TabsList>
                        <TabsContent value="problem">Problem Statement</TabsContent>
                        <TabsContent value="submissions">
                            {/* Previous submissions */}
                            <SubmissionPage/>
                        </TabsContent>
                        <TabsContent value="solutions">Solutions</TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle={true}/>
                <ResizablePanel defaultSize={50}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel
                            minSize={10}
                            maxSize={80}
                            onResize={() => {
                                // Adjust the CodeMirror editor size here if needed
                            }}>
                            <div
                                onClick={() => editorRef.current.focus()}
                                className="flex h-full items-center justify-center bg-editorBackground">
                                <CodeMirror
                                    value={value}
                                    autoFocus={true}
                                    ref={editorRef}
                                    theme={vscodeDark}
                                    extensions={[javascript({jsx: true})]}
                                    className="w-full h-full bottom-0 left-1"
                                />
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle={true}/>
                        <ResizablePanel defaultSize={75}>
                            <div className={"flex flex-1 bg-inputBackground items-center"}>
                                <p className={"p-3"}>Test Cases</p>
                                <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    size={"xl"}
                                    className={"text-primary"}
                                />
                            </div>
                            <div className={"flex-row flex m-10"}>
                                <Tabs defaultValue="case1" className="flex-1 w-fit ">
                                    <TabsList className={""}>
                                        <TabsTrigger value="case1">Case 1</TabsTrigger>
                                        <TabsTrigger value="case2">Case 2</TabsTrigger>
                                        <TabsTrigger value="case3">Case 3</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="case1">
                                        <div className={"mt-5"}>
                                            <p>Input=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>
                                                    [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]
                                                </p>
                                            </div>
                                            <p className={"mt-5"}>Output=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>"ABCCED"</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="case2">
                                        <div className={"mt-5"}>
                                            <p>Input=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>
                                                    [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]
                                                </p>
                                            </div>
                                            <p className={"mt-5"}>Output=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>"ABCCED"</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="case3">
                                        <div className={"mt-5"}>
                                            <p>Input=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>
                                                    [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]
                                                </p>
                                            </div>
                                            <p className={"mt-5"}>Output=</p>
                                            <div
                                                className={
                                                    "bg-inputBackground flex flex-1 rounded-2xl mt-2"
                                                }>
                                                <p className={"p-3 text-xl"}>"ABCCED"</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <div className="flex h-full ">
                                    <Button>Run</Button>
                                </div>
                                <div className="flex h-full pl-2">
                                    <Button>Submit</Button>
                                </div>
                            </div>
                            <div></div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default Problem;
