import React, {useState} from 'react'
import {Poppins} from 'next/font/google'
import {useRouter} from 'next/router'
import {Button} from '@bsg/ui/button'
import {Label} from "@bsg/ui/label"
import {Slider} from "@bsg/ui/slider"
import {Checkbox} from "@bsg/ui/checkbox"
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@bsg/ui/field"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@bsg/ui/accordion"
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@bsg/ui/combobox"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faX} from '@fortawesome/free-solid-svg-icons'
import Difficulty from "@bsg/models/Difficulty";
import {IncDecButtons} from "@/customComponents/inc-dec-buttons";
import {useRoomChoice} from "@/hooks/useRoomChoice";
import {useRoomInit} from "@/hooks/useRoomInit";
import {NumberOfProblemsWithDifficultyLabel} from "@/customComponents/number-of-problems-with-difficulty-label";

const poppins = Poppins({weight: '400', subsets: ['latin']})

const SECTIONS = ["problems", "lists", "topics", "companies", "duration"] as const
const LAST_STEP = SECTIONS.length - 1

export default function CreateRoomPage() {
    const router = useRouter()
    const {createRoom} = useRoomInit()
    const topicComboboxAnchor = useComboboxAnchor()
    const companyComboboxAnchor = useComboboxAnchor()

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
        duration,
        setDuration,
        handleCreateRoom,
        resetFilters,
        formError,
        setFormError,
        isSubmittingCreate,
    } = useRoomChoice({onCreate: createRoom})

    const [currentStep, setCurrentStep] = useState(0)
    // The wizard starts on step 0 with the Create button visible so a user can create
    // a room immediately without touching any filters. The button only switches to
    // Next once they've actually interacted with the first section's controls.
    const [firstStepTouched, setFirstStepTouched] = useState(false)

    const isLastStep = currentStep === LAST_STEP
    const showCreateLabel = (currentStep === 0 && !firstStepTouched) || isLastStep

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
        <div className={`${poppins.className} relative min-h-full flex px-4 py-4`}>

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative m-auto w-full min-w-[300px] max-w-sm p-5 rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="text-lg text-foreground font-semibold">Create a Room</h2>
                    <button
                        onClick={() => router.push('/room-choice-page')}
                        aria-label="Cancel"
                        title="Cancel"
                        className="shrink-0 text-foreground/60 hover:text-foreground rounded focus:outline-none p-1 transition-transform duration-200 hover:scale-125"
                    >
                        <FontAwesomeIcon icon={faX}/>
                    </button>
                </div>

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
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="shrink-0 whitespace-nowrap">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Easy}
                                                                             num={numberOfEasyProblems}
                                                                             disabled={anyDifficulty}/>
                                    </span>
                                    <IncDecButtons
                                        disabled={anyDifficulty}
                                        decrementOnClick={() => {
                                            touchFirstStep()
                                            decrement(setNumberOfEasyProblems, numberOfEasyProblems)
                                        }}
                                        incrementOnClick={() => {
                                            touchFirstStep()
                                            increment(setNumberOfEasyProblems, numberOfEasyProblems)
                                        }}/>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="shrink-0 whitespace-nowrap">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium}
                                                                             num={numberOfMediumProblems}
                                                                             disabled={anyDifficulty}/>
                                    </span>
                                    <IncDecButtons
                                        disabled={anyDifficulty}
                                        decrementOnClick={() => {
                                            touchFirstStep()
                                            decrement(setNumberOfMediumProblems, numberOfMediumProblems)
                                        }}
                                        incrementOnClick={() => {
                                            touchFirstStep()
                                            increment(setNumberOfMediumProblems, numberOfMediumProblems)
                                        }}/>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="shrink-0 whitespace-nowrap">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard}
                                                                             num={numberOfHardProblems}
                                                                             disabled={anyDifficulty}/>
                                    </span>
                                    <IncDecButtons
                                        disabled={anyDifficulty}
                                        decrementOnClick={() => {
                                            touchFirstStep()
                                            decrement(setNumberOfHardProblems, numberOfHardProblems)
                                        }}
                                        incrementOnClick={() => {
                                            touchFirstStep()
                                            increment(setNumberOfHardProblems, numberOfHardProblems)
                                        }}/>
                                </div>

                                {/* Any difficulty */}
                                <div className="flex items-center justify-between gap-3">
                                    <FieldGroup>
                                        <Field orientation={'horizontal'}>
                                            <Checkbox
                                                id="any-difficulty-checkbox"
                                                checked={anyDifficulty}
                                                onCheckedChange={(checked: boolean) => {
                                                    touchFirstStep()
                                                    setAnyDifficulty(checked)
                                                }}
                                            />
                                            <FieldContent>
                                                <FieldLabel htmlFor="any-difficulty-checkbox" className="text-lg">
                                                    Any Difficulty: {anyDifficultyCount}
                                                </FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    </FieldGroup>
                                    <IncDecButtons
                                        decrementOnClick={() => {
                                            touchFirstStep()
                                            setAnyDifficultyCount(Math.max(1, anyDifficultyCount - 1))
                                        }}
                                        incrementOnClick={() => {
                                            touchFirstStep()
                                            setAnyDifficultyCount(Math.min(10, anyDifficultyCount + 1))
                                        }}/>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Pick from a list */}
                    <AccordionItem value="lists">
                        <AccordionTrigger>Pick from a list</AccordionTrigger>
                        <AccordionContent>
                            <FieldGroup>
                                <Field orientation="horizontal" className="items-start">
                                    <Checkbox id="blind75-checkbox" checked={blind75} onCheckedChange={setBlind75}/>
                                    <FieldContent>
                                        <FieldLabel htmlFor="blind75-checkbox">
                                            Select problems from the Blind 75
                                        </FieldLabel>
                                        <FieldDescription>
                                            The best practice questions to prepare for algorithmic coding interviews
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>
                                <Field orientation="horizontal" className="items-start">
                                    <Checkbox id="neetcode150-checkbox" checked={neetcode150} onCheckedChange={setNeetcode150}/>
                                    <FieldContent>
                                        <FieldLabel htmlFor="neetcode150-checkbox">
                                            Select problems from the Neetcode 150
                                        </FieldLabel>
                                        <FieldDescription>
                                            Problems sourced from{' '}
                                            <a href="https://neetcode.io/" target="_blank" rel="noopener noreferrer">
                                                neetcode.io
                                            </a>
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Select topics */}
                    <AccordionItem value="topics">
                        <AccordionTrigger>Select topics</AccordionTrigger>
                        <AccordionContent>
                            <Combobox
                                multiple
                                autoHighlight
                                items={topics}
                                value={selectedTopics}
                                onValueChange={setSelectedTopics}
                            >
                                <ComboboxChips ref={topicComboboxAnchor} className="w-full">
                                    <ComboboxValue>
                                        {(values: string[]) => (
                                            <React.Fragment>
                                                {values.map((value) => (
                                                    <ComboboxChip key={value}>{value}</ComboboxChip>
                                                ))}
                                                <ComboboxChipsInput placeholder={selectedTopics.length ? '' : 'e.g. Array, Dynamic Programming...'}/>
                                            </React.Fragment>
                                        )}
                                    </ComboboxValue>
                                </ComboboxChips>
                                <ComboboxContent anchor={topicComboboxAnchor}>
                                    <ComboboxEmpty>No topics found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: string) => (
                                            <ComboboxItem key={item} value={item}>
                                                {item}{typeof topicCounts[item] === 'number' ? ` (${topicCounts[item]})` : ''}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Select Companies */}
                    <AccordionItem value="companies">
                        <AccordionTrigger>Select Companies</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3">
                                <Combobox
                                    multiple
                                    autoHighlight
                                    items={companies}
                                    value={selectedCompanies}
                                    onValueChange={setSelectedCompanies}
                                >
                                    <ComboboxChips ref={companyComboboxAnchor} className="w-full">
                                        <ComboboxValue>
                                            {(values: string[]) => (
                                                <React.Fragment>
                                                    {values.map((value) => (
                                                        <ComboboxChip key={value}>{value}</ComboboxChip>
                                                    ))}
                                                    <ComboboxChipsInput placeholder={selectedCompanies.length ? '' : 'e.g. Google, Amazon...'}/>
                                                </React.Fragment>
                                            )}
                                        </ComboboxValue>
                                    </ComboboxChips>
                                    <ComboboxContent anchor={companyComboboxAnchor}>
                                        <ComboboxEmpty>No companies found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: string) => (
                                                <ComboboxItem key={item} value={item}>
                                                    {item}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox checked={recentlyAsked} onCheckedChange={setRecentlyAsked}
                                                  disabled={selectedCompanies.length === 0}/>
                                        <Label
                                            className={`text-sm text-foreground ${selectedCompanies.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                            onClick={() => selectedCompanies.length > 0 && setRecentlyAsked((prev) => !prev)}>
                                            Recently asked
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Duration */}
                    <AccordionItem value="duration">
                        <AccordionTrigger>Duration</AccordionTrigger>
                        <AccordionContent>
                            <Label className="text-sm text-foreground/60">{duration} mins</Label>
                            <Slider min={5} max={120} step={5} value={[duration]}
                                    onValueChange={(v) => setDuration(v[0])} className="pt-2"/>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Error */}
                {formError && (
                    <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 mt-4 text-sm text-red-200">
                        <div className="flex items-start justify-between gap-3">
                            <span>{formError}</span>
                            <button
                                type="button"
                                onClick={() => setFormError(null)}
                                aria-label="Dismiss error"
                                className="shrink-0 rounded px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                            >
                                x
                            </button>
                        </div>
                    </div>
                )}

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
                        disabled={isSubmittingCreate || (showCreateLabel && availableCount === 0)}
                        className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                    >
                        {isSubmittingCreate
                            ? 'Creating...'
                            : `${showCreateLabel ? 'Create' : 'Next'}${availableCount !== null ? ` (${availableCount} problem${availableCount === 1 ? '' : 's'})` : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    )
}
