import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"
import {
    Label,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@bsg/ui/chart"
import { User } from "@bsg/models/User";
import { useEffect, useRef, useState } from "react";
import { Button } from "@bsg/ui/button";

export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {

    const isAnimationsActive = true;

    type ActiveChart = 'score' | 'percentile' | 'solveTime' | 'runTime' | 'memory';
    const chartUnits: Record<ActiveChart, string> = {
        score: ' pts',
        solveTime: ' mins',
        runTime: ' ms',
        memory: ' MB',
        percentile: '%'
    };

    const [activeChart, setActiveChart] = useState<ActiveChart>('score');
    const [hoveredTab, setHoveredTab] = useState<ActiveChart | null>(null)
    const [hasAnimated, setHasAnimated] = useState<boolean>(false);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

    useEffect(() => setHasAnimated(false), [isActive]);

    const chartConfig: ChartConfig = {
        score: { label: "Score", color: "#FFFFFF" },
        solveTime: { label: "Solve Time", color: "#FFFFFF" },
        runTime: { label: "Run Time", color: "#FFFFFF" },
        memory: { label: "Memory", color: "#FFFFFF" }
    };

    type SubmissionEntry = {
        username: string,
        solveTime: number,
        runTime: number,
        memory: number,
        score: number
    };

    const chartData: SubmissionEntry[] = [
        { username: 'test1', solveTime: 1, runTime: 1, memory: 1, score: 1 },
        { username: 'test2', solveTime: 2, runTime: 2, memory: 2, score: 2 },
        { username: 'test3', solveTime: 3, runTime: 3, memory: 3, score: 3 },
        { username: 'test4', solveTime: 4, runTime: 4, memory: 4, score: 4 },
        { username: 'test5', solveTime: 5, runTime: 5, memory: 5, score: 5 }
    ];

    type MetricEntry = {
        metric: 'solveTime' | 'runTime' | 'memory' | 'score',
        value: number
    };

    const radarData: MetricEntry[] = [];

    const radialData: SubmissionEntry[] = [{
        username: 'test1',
        solveTime: 1000,
        runTime: 1000,
        memory: 1000,
        score: 3000
    }];

    const maxPoints = 5000;

    return (
        <div className={`flex flex-col items-center p-4 pt-3 gap-4 ${(isActive) ? '' : 'hidden'}`}>
            <div className="w-full flex gap-4 justify-between">
                <div className="flex flex-col gap-2 text-base font-medium">
                    Submission Details

                    <div className="flex rounded-lg text-sm border border-[#454545]">
                        <div className="flex flex-col gap-2 px-4 py-3 font-normal border-r border-[#454545]">
                            Solve Time
                            <div className="text-lg font-medium">
                                00:23:41
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 px-4 py-3 font-normal border-r border-[#454545]">
                            Run Time
                            <div className="text-lg font-medium">
                                0 ms
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 px-4 py-3 font-normal">
                            Memory
                            <div className="text-lg font-medium">
                                14.80 MB
                            </div>
                        </div>
                    </div>
                </div>

                <ChartContainer
                    config={chartConfig}
                    className='h-28 w-48 [&_.recharts-radial-bar-background-sector]:fill-[#333333]'
                    onMouseMove={() => { if (hasAnimated) setShowBreakdown(true) }}
                    onMouseLeave={() => setShowBreakdown(false)}
                >
                    <RadialBarChart
                        data={radialData}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={64}
                        outerRadius={96}
                        cy='85%'
                    >
                        <PolarAngleAxis
                            type='number'
                            domain={[0, maxPoints]}
                            tick={false}
                        />

                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) - 16}
                                                className="fill-foreground text-2xl font-bold"
                                            >
                                                {radialData[0].score}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 4}
                                                className="fill-muted-foreground"
                                            >
                                                /{maxPoints} pts
                                            </tspan>
                                        </text>
                                    )
                                }
                            }}
                        />

                        {(showBreakdown) ?
                            <>
                                <RadialBar
                                    background
                                    stackId='breakdown'
                                    dataKey='solveTime'
                                    fill='#DDDDDD'
                                    isAnimationActive={false}
                                    className=''
                                />
                                <RadialBar
                                    background
                                    stackId='breakdown'
                                    dataKey='runTime'
                                    fill='#BBBBBB'
                                    isAnimationActive={false}
                                    className=''
                                />
                                <RadialBar
                                    background
                                    stackId='breakdown'
                                    dataKey='memory'
                                    fill='#999999'
                                    isAnimationActive={false}
                                    className=''
                                />
                            </>
                            :
                            <RadialBar
                                background
                                dataKey='score'
                                fill='#FFFFFF'
                                isAnimationActive={isAnimationsActive && !hasAnimated}
                                onAnimationEnd={() => setHasAnimated(true)}
                                className=''
                            />
                        }
                    </RadialBarChart>
                </ChartContainer>
            </div>

            <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 items-center text-sm text-foreground/60 font-medium">
                    Room Statistics
                </div>

                <div className="flex rounded-lg border border-[#454545] overflow-hidden">
                    <div className="flex items-center p-2 overflow-x-auto no-scrollbar">
                        <Button
                            onMouseEnter={() => setHoveredTab('score')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveChart('score')}
                            className={`flex h-auto px-2 py-1 bg-transparent rounded-[5px] ${(activeChart === 'score') ? 'bg-[#373737] hover:bg-[#373737]' : ''}`}
                        >
                            <div className={`flex gap-1 text-sm hover:opacity-100 font-normal ${(activeChart === 'score') ? '' : 'opacity-60'}`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[rgb(255,157,20)]">
                                    <svg
                                        className="w-4 h-4 overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 36 27"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-width="3"
                                            d="M7.2002 16.2998C7.28883 16.2998 7.37706 16.3019 7.46484 16.3057C6.09827 18.332 5.2998 20.7753 5.2998 23.4004V24.2998C5.2998 24.5715 5.32105 24.8386 5.35938 25.0996H1.7998C1.35656 25.0995 1 24.7431 1 24.2998V22.5C1 19.0754 3.77561 16.2998 7.2002 16.2998ZM18 15.4004C22.4202 15.4004 26 18.9802 26 23.4004V24.2998C26 24.7431 25.6434 25.0995 25.2002 25.0996H10.7998C10.3566 25.0995 10 24.7431 10 24.2998V23.4004C10 18.9802 13.5798 15.4004 18 15.4004ZM28.7998 16.2998C32.2244 16.2998 35 19.0754 35 22.5V24.2998C35 24.7431 34.6434 25.0995 34.2002 25.0996H30.6406C30.679 24.8386 30.7002 24.5715 30.7002 24.2998V23.4004C30.7002 20.7751 29.9009 18.3321 28.5342 16.3057C28.6223 16.3019 28.7108 16.2998 28.7998 16.2998ZM5.40039 5.0498C7.08655 5.05002 8.44998 6.41345 8.4502 8.09961C8.4502 9.78594 7.08668 11.1502 5.40039 11.1504C3.71393 11.1504 2.34961 9.78607 2.34961 8.09961C2.34982 6.41332 3.71406 5.0498 5.40039 5.0498ZM30.5996 5.0498C32.2859 5.0498 33.6502 6.41332 33.6504 8.09961C33.6504 9.78607 32.2861 11.1504 30.5996 11.1504C28.9133 11.1502 27.5498 9.78594 27.5498 8.09961C27.55 6.41346 28.9135 5.05002 30.5996 5.0498ZM18 1C20.6763 1 22.8494 3.17332 22.8496 5.84961C22.8496 8.52607 20.6765 10.7002 18 10.7002C15.3235 10.7002 13.1504 8.52608 13.1504 5.84961C13.1506 3.17332 15.3237 1 18 1Z"
                                        />
                                    </svg>
                                </div>

                                Score
                            </div>
                        </Button>

                        <div className={`min-w-[1px] h-3 bg-[#505050] ${(activeChart === 'score' || activeChart === 'solveTime') ? 'invisible' : ''}`} />

                        <Button
                            onMouseEnter={() => setHoveredTab('solveTime')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveChart('solveTime')}
                            className={`flex h-auto px-2 py-1 bg-transparent rounded-[5px] ${(activeChart === 'solveTime') ? 'bg-[#373737] hover:bg-[#373737]' : ''}`}
                        >
                            <div className={`flex gap-1 text-sm hover:opacity-100 font-normal ${(activeChart === 'solveTime') ? '' : 'opacity-60'}`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[rgb(0,123,255)]">
                                    <svg
                                        className="w-[1em] h-[1em] overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                    >
                                        <path d="M51.9 384.9C19.3 344.6 0 294.4 0 240 0 107.5 114.6 0 256 0S512 107.5 512 240 397.4 480 256 480c-36.5 0-71.2-7.2-102.6-20L37 509.9c-3.7 1.6-7.5 2.1-11.5 2.1-14.1 0-25.5-11.4-25.5-25.5 0-4.3 1.1-8.5 3.1-12.2l48.8-89.4zm37.3-30.2c12.2 15.1 14.1 36.1 4.8 53.2l-18 33.1 58.5-25.1c11.8-5.1 25.2-5.2 37.1-.3 25.7 10.5 54.2 16.4 84.3 16.4 117.8 0 208-88.8 208-192S373.8 48 256 48 48 136.8 48 240c0 42.8 15.1 82.4 41.2 114.7z" />
                                    </svg>
                                </div>

                                Solve Time
                            </div>
                        </Button>

                        <div className={`min-w-[1px] h-3 bg-[#505050] ${(activeChart === 'solveTime' || activeChart === 'runTime') ? 'invisible' : ''}`} />

                        <Button
                            onMouseEnter={() => setHoveredTab('runTime')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveChart('runTime')}
                            className={`flex h-auto px-2 py-1 bg-transparent rounded-[5px] ${(activeChart === 'runTime') ? 'bg-[#373737] hover:bg-[#373737]' : ''}`}
                        >
                            <div className={`flex gap-1 text-sm hover:opacity-100 font-normal ${(activeChart === 'runTime') ? '' : 'opacity-60'}`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[rgb(255,183,0)]">
                                    <svg
                                        className="w-4 h-4 overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 38 38"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-width="3.5"
                                            stroke-linecap="round"
                                            d="M25 36.6851H35C36.1046 36.6851 37 35.7897 37 34.6851V29.6851C37 28.5805 36.1046 27.6851 35 27.6851H25M25 36.6851H13M25 36.6851V27.6851M13 36.6851H3C1.89543 36.6851 1 35.7897 1 34.6851V26.1851C1 25.0805 1.89543 24.1851 3 24.1851H13M13 36.6851V24.1851M13 24.1851V21.6851C13 20.5805 13.8954 19.6851 15 19.6851H23C24.1046 19.6851 25 20.5805 25 21.6851V27.6851M16.8127 4.87245L12.8439 5.44915C12.6388 5.47895 12.557 5.73094 12.7053 5.87557L15.5772 8.67493C15.6361 8.73236 15.663 8.81511 15.6491 8.89621L14.9711 12.849C14.9361 13.0532 15.1505 13.2089 15.3339 13.1125L18.8837 11.2463C18.9565 11.208 19.0435 11.208 19.1163 11.2463L22.6661 13.1125C22.8495 13.2089 23.0639 13.0532 23.0289 12.849L22.3509 8.89621C22.337 8.81511 22.3639 8.73236 22.4228 8.67493L25.2947 5.87557C25.443 5.73094 25.3612 5.47895 25.1561 5.44915L21.1873 4.87245C21.1059 4.86062 21.0355 4.80948 20.9991 4.73569L19.2242 1.13936C19.1325 0.953547 18.8675 0.953548 18.7758 1.13936L17.0009 4.73569C16.9645 4.80948 16.8941 4.86062 16.8127 4.87245Z"
                                        />
                                    </svg>
                                </div>

                                Run Time
                            </div>
                        </Button>

                        <div className={`min-w-[1px] h-3 bg-[#505050] ${(activeChart === 'runTime' || activeChart === 'memory') ? 'invisible' : ''}`} />

                        <Button
                            onMouseEnter={() => setHoveredTab('memory')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveChart('memory')}
                            className={`flex h-auto px-2 py-1 bg-transparent rounded-[5px] ${(activeChart === 'memory') ? 'bg-[#373737] hover:bg-[#373737]' : ''}`}
                        >
                            <div className={`flex gap-1 text-sm hover:opacity-100 font-normal ${(activeChart === 'memory') ? '' : 'opacity-60'}`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[rgb(2,177,40)]">
                                    <svg
                                        className="w-4 h-4 overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 38 32"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-width="3.5"
                                            stroke-linecap="round"
                                            d="M36 30H6C3.79086 30 2 28.2091 2 26V2M10 22V16M18 22V8M26 22V12M34 22V4"
                                        />
                                    </svg>
                                </div>

                                Memory
                            </div>
                        </Button>

                        <div className={`min-w-[1px] h-3 bg-[#505050] ${(activeChart === 'memory' || activeChart === 'percentile') ? 'invisible' : ''}`} />

                        <Button
                            onMouseEnter={() => setHoveredTab('percentile')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveChart('percentile')}
                            className={`flex h-auto px-2 py-1 bg-transparent rounded-[5px] ${(activeChart === 'percentile') ? 'bg-[#373737] hover:bg-[#373737]' : ''}`}
                        >
                            <div className={`flex gap-1 text-sm hover:opacity-100 font-normal ${(activeChart === 'percentile') ? '' : 'opacity-60'}`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[rgb(255,157,20)]">
                                    <svg
                                        className="w-4 h-4 overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 36 27"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-width="3"
                                            d="M7.2002 16.2998C7.28883 16.2998 7.37706 16.3019 7.46484 16.3057C6.09827 18.332 5.2998 20.7753 5.2998 23.4004V24.2998C5.2998 24.5715 5.32105 24.8386 5.35938 25.0996H1.7998C1.35656 25.0995 1 24.7431 1 24.2998V22.5C1 19.0754 3.77561 16.2998 7.2002 16.2998ZM18 15.4004C22.4202 15.4004 26 18.9802 26 23.4004V24.2998C26 24.7431 25.6434 25.0995 25.2002 25.0996H10.7998C10.3566 25.0995 10 24.7431 10 24.2998V23.4004C10 18.9802 13.5798 15.4004 18 15.4004ZM28.7998 16.2998C32.2244 16.2998 35 19.0754 35 22.5V24.2998C35 24.7431 34.6434 25.0995 34.2002 25.0996H30.6406C30.679 24.8386 30.7002 24.5715 30.7002 24.2998V23.4004C30.7002 20.7751 29.9009 18.3321 28.5342 16.3057C28.6223 16.3019 28.7108 16.2998 28.7998 16.2998ZM5.40039 5.0498C7.08655 5.05002 8.44998 6.41345 8.4502 8.09961C8.4502 9.78594 7.08668 11.1502 5.40039 11.1504C3.71393 11.1504 2.34961 9.78607 2.34961 8.09961C2.34982 6.41332 3.71406 5.0498 5.40039 5.0498ZM30.5996 5.0498C32.2859 5.0498 33.6502 6.41332 33.6504 8.09961C33.6504 9.78607 32.2861 11.1504 30.5996 11.1504C28.9133 11.1502 27.5498 9.78594 27.5498 8.09961C27.55 6.41346 28.9135 5.05002 30.5996 5.0498ZM18 1C20.6763 1 22.8494 3.17332 22.8496 5.84961C22.8496 8.52607 20.6765 10.7002 18 10.7002C15.3235 10.7002 13.1504 8.52608 13.1504 5.84961C13.1506 3.17332 15.3237 1 18 1Z"
                                        />
                                    </svg>
                                </div>

                                Percentile
                            </div>
                        </Button>
                    </div>

                    <div className='p-4 overflow-x-auto'>
                        <ChartContainer
                            config={chartConfig}
                            className='h-64'
                        >
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />

                                <XAxis
                                    dataKey='username'
                                    tickLine={false}
                                />

                                <YAxis
                                    unit={chartUnits[activeChart]}
                                />

                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />

                                {(activeChart === 'percentile') ?
                                    <>
                                        <Bar
                                            dataKey='solveTime'
                                            fill='#FFFFFF'
                                            radius={[4, 4, 0, 0]}
                                            isAnimationActive={isAnimationsActive}
                                        />
                                        <Bar
                                            dataKey='runTime'
                                            fill='#FFFFFF'
                                            radius={[4, 4, 0, 0]}
                                            isAnimationActive={isAnimationsActive}
                                        />
                                        <Bar
                                            dataKey='memory'
                                            fill='#FFFFFF'
                                            radius={[4, 4, 0, 0]}
                                            isAnimationActive={isAnimationsActive}
                                        />

                                        <ChartLegend content={<ChartLegendContent />} />
                                    </>
                                    :
                                    <Bar
                                        dataKey={activeChart}
                                        fill='#FFFFFF'
                                        radius={[4, 4, 0, 0]}
                                        isAnimationActive={isAnimationsActive}
                                    />
                                }
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 items-center text-sm text-foreground/60 font-medium">
                    Code
                    <div className='min-w-[1px] h-3 bg-[#505050]' />
                    C++
                </div>

                <div className="rounded-lg bg-[#333333] h-64">

                </div>
            </div>
        </div>
    );
};