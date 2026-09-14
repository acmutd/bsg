import {useState} from 'react'
import {Button} from '@bsg/ui/button'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@bsg/ui/accordion"
import {useRoomChoice} from "@/hooks/useRoomChoice"
import {ProblemCountSection} from "@/customComponents/CreateRoom/problem-count-section"
import {ProblemListSection} from "@/customComponents/CreateRoom/problem-list-section"
import {TopicSelectSection} from "@/customComponents/CreateRoom/topic-select-section"
import {CompanySelectSection} from "@/customComponents/CreateRoom/company-select-section"
import {DurationPicker} from "@/customComponents/CreateRoom/duration-picker"
import {FormErrorMessage} from "@/customComponents/CreateRoom/form-error-message"

const SECTIONS = ["problems", "lists", "topics", "companies", "duration"] as const
const LAST_STEP = SECTIONS.length - 1

export const FilterProblemsTab = ({createRoom}: {
    createRoom: (
        roomCode: string,
        options: {
            easy: number; medium: number; hard: number; duration: number;
            tags: string[]; companies: string[]; blind75: boolean; neetcode150: boolean;
            recentlyAsked: boolean; anyDifficulty: boolean; anyDifficultyCount: number
        },
    ) => Promise<{ success: true } | { success: false; message: string }>
}) => {
    const {
        numberOfEasyProblems,
        numberOfMediumProblems,
        numberOfHardProblems,
        setNumberOfEasyProblems,
        setNumberOfMediumProblems,
        setNumberOfHardProblems,
        anyDifficulty,
        setAnyDifficulty,
        anyDifficultyCount,
        setAnyDifficultyCount,
        increment,
        decrement,
        topics,
        topicCounts,
        selectedTopics,
        setSelectedTopics,
        companies,
        selectedCompanies,
        setSelectedCompanies,
        blind75,
        setBlind75,
        neetcode150,
        setNeetcode150,
        recentlyAsked,
        setRecentlyAsked,
        availableCount,
        isLoadingFilter,
        requestedTotal,
        duration,
        setDuration,
        handleCreateRoom,
        resetFilters,
        formError,
        setFormError,
        isSubmittingCreate,
    } = useRoomChoice({onCreate: createRoom})

    const [currentStep, setCurrentStep] = useState(0)
    const [firstStepTouched, setFirstStepTouched] = useState(false)

    const isLastStep = currentStep === LAST_STEP
    const showCreateLabel = (currentStep === 0 && !firstStepTouched) || isLastStep

    const notEnoughProblems = availableCount !== null && availableCount < requestedTotal

    const touchFirstStep = () => {
        if (!firstStepTouched) setFirstStepTouched(true)
    }

    const handlePrimaryAction = () => {
        if (showCreateLabel) {
            handleCreateRoom()
        } else {
            setCurrentStep((step) => Math.min(step + 1, LAST_STEP))
        }
    }

    const handleReset = () => {
        resetFilters()
        setCurrentStep(0)
        setFirstStepTouched(false)
    }

    return (
        <>
            <Accordion
                type="single"
                className="rounded-lg border border-bsg-border px-3"
                value={SECTIONS[currentStep]}
                onValueChange={(value) => {
                    const index = SECTIONS.indexOf(value as typeof SECTIONS[number])
                    if (index !== -1) setCurrentStep(index)
                }}
            >
                {/* # of problems */}
                <AccordionItem value="problems">
                    <AccordionTrigger>Number of Problems</AccordionTrigger>
                    <AccordionContent>
                        <ProblemCountSection
                            numberOfEasyProblems={numberOfEasyProblems}
                            numberOfMediumProblems={numberOfMediumProblems}
                            numberOfHardProblems={numberOfHardProblems}
                            setNumberOfEasyProblems={setNumberOfEasyProblems}
                            setNumberOfMediumProblems={setNumberOfMediumProblems}
                            setNumberOfHardProblems={setNumberOfHardProblems}
                            anyDifficulty={anyDifficulty}
                            setAnyDifficulty={setAnyDifficulty}
                            anyDifficultyCount={anyDifficultyCount}
                            setAnyDifficultyCount={setAnyDifficultyCount}
                            increment={increment}
                            decrement={decrement}
                            onTouch={touchFirstStep}
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Pick from a list */}
                <AccordionItem value="lists">
                    <AccordionTrigger>Pick from a list</AccordionTrigger>
                    <AccordionContent>
                        <ProblemListSection
                            blind75={blind75}
                            setBlind75={setBlind75}
                            neetcode150={neetcode150}
                            setNeetcode150={setNeetcode150}
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Select topics */}
                <AccordionItem value="topics">
                    <AccordionTrigger>Select topics</AccordionTrigger>
                    <AccordionContent>
                        <TopicSelectSection
                            topics={topics}
                            topicCounts={topicCounts}
                            selectedTopics={selectedTopics}
                            setSelectedTopics={setSelectedTopics}
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Select Companies */}
                <AccordionItem value="companies">
                    <AccordionTrigger>Select Companies</AccordionTrigger>
                    <AccordionContent>
                        <CompanySelectSection
                            companies={companies}
                            selectedCompanies={selectedCompanies}
                            setSelectedCompanies={setSelectedCompanies}
                            recentlyAsked={recentlyAsked}
                            setRecentlyAsked={setRecentlyAsked}
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Duration */}
                <AccordionItem value="duration">
                    <AccordionTrigger>Duration</AccordionTrigger>
                    <AccordionContent>
                        <DurationPicker duration={duration} onDurationChange={setDuration}/>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Error */}
            <FormErrorMessage message={formError} onDismiss={() => setFormError(null)} className="mt-4"/>

            {/* Footer: Reset (bottom-left) / Create-Next (bottom-right) */}
            <div className="flex items-center justify-between mt-5">
                <Button
                    onClick={handleReset}
                    variant="outline"
                    className="px-4 py-2 bg-transparent border-bsg-border hover:bg-bsg-surface hover:text-foreground"
                >
                    Reset
                </Button>
                <Button
                    onClick={handlePrimaryAction}
                    disabled={isSubmittingCreate || isLoadingFilter || (showCreateLabel && notEnoughProblems)}
                    className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                >
                    {isSubmittingCreate
                        ? 'Creating...'
                        : isLoadingFilter
                            ? 'Loading...'
                            : `${showCreateLabel ? 'Create' : 'Next'}${availableCount !== null ? ` (${availableCount} problem${availableCount === 1 ? '' : 's'})` : ''}`}
                </Button>
            </div>

            {!isLoadingFilter && showCreateLabel && notEnoughProblems && (
                <p className="mt-2 text-sm text-red-500 text-center">
                    {availableCount === 0
                        ? 'No problems found with these filters, try adjusting them!'
                        : `Only ${availableCount} problem${availableCount === 1 ? '' : 's'} found with these filters but you asked for ${requestedTotal}, try adjusting them!`}
                </p>
            )}
        </>
    )
}
