import React from 'react'
import {Button} from '@bsg/ui/button'
import {Label} from '@bsg/ui/label'
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
} from '@bsg/ui/combobox'
import {MAX_CHOSEN_PROBLEMS, useProblemPicker} from '@/hooks/useProblemPicker'
import {DurationPicker} from '@/customComponents/CreateRoom/duration-picker'
import {FormErrorMessage} from '@/customComponents/CreateRoom/form-error-message'

const RENDERED_MATCHES = 50

export const ChooseProblemsTab = ({createRoom}: {
    createRoom: (roomCode: string, options: { duration: number; problemIds: number[] }) => Promise<{ success: true } | { success: false; message: string }>
}) => {
    const problemComboboxAnchor = useComboboxAnchor()

    const {
        problemNames,
        isLoadingProblems,
        selectedProblems,
        selectProblems,
        duration,
        setDuration,
        handleCreateRoom,
        resetSelection,
        formError,
        setFormError,
        isSubmittingCreate,
    } = useProblemPicker({onCreate: createRoom})

    const atLimit = selectedProblems.length >= MAX_CHOSEN_PROBLEMS

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-bsg-border px-3 py-3 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                        <Label className="text-sm text-foreground">Pick your problems</Label>
                        <span className="text-xs text-foreground/60">
                            {selectedProblems.length}/{MAX_CHOSEN_PROBLEMS}
                        </span>
                    </div>

                    <Combobox
                        multiple
                        autoHighlight
                        limit={RENDERED_MATCHES}
                        items={problemNames}
                        value={selectedProblems}
                        onValueChange={selectProblems}
                    >
                        <ComboboxChips ref={problemComboboxAnchor} className="w-full">
                            <ComboboxValue>
                                {(values: string[]) => (
                                    <React.Fragment>
                                        {values.map((value) => (
                                            <ComboboxChip key={value}>{value}</ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput
                                            placeholder={
                                                isLoadingProblems
                                                    ? 'Loading problems...'
                                                    : selectedProblems.length
                                                        ? ''
                                                        : 'e.g. Two Sum, Valid Parentheses...'
                                            }
                                        />
                                    </React.Fragment>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent anchor={problemComboboxAnchor}>
                            <ComboboxEmpty>No problems found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: string) => (
                                    <ComboboxItem key={item} value={item}>
                                        {item}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>

                    {atLimit && (
                        <p className="text-xs text-foreground/60">
                            That&apos;s the max of {MAX_CHOSEN_PROBLEMS} problems - remove one to swap it out.
                        </p>
                    )}
                </div>

                <DurationPicker duration={duration} onDurationChange={setDuration}/>
            </div>

            <FormErrorMessage message={formError} onDismiss={() => setFormError(null)}/>

            <div className="flex items-center justify-between">
                <Button
                    onClick={resetSelection}
                    variant="outline"
                    className="px-4 py-2 bg-transparent border-bsg-border hover:bg-bsg-surface hover:text-foreground"
                >
                    Reset
                </Button>
                <Button
                    onClick={handleCreateRoom}
                    disabled={isSubmittingCreate || selectedProblems.length === 0}
                    className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                >
                    {isSubmittingCreate ? 'Creating...' : 'Create'}
                </Button>
            </div>

            {selectedProblems.length === 0 && (
                <p className="text-sm text-red-500 text-center">
                    Pick at least one problem to create a room!
                </p>
            )}
        </div>
    )
}
