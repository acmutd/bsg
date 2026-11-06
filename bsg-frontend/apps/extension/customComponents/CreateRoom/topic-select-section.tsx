import React, {Dispatch, SetStateAction} from 'react'
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

type TopicSelectSectionProps = {
    topics: string[];
    topicCounts: Record<string, number>;
    selectedTopics: string[];
    setSelectedTopics: Dispatch<SetStateAction<string[]>>;
};

// Topic filter. The counts beside each topic reflect the difficulties currently
// selected, so they match the pool size shown on the Next/Create button.
export const TopicSelectSection = ({
    topics,
    topicCounts,
    selectedTopics,
    setSelectedTopics,
}: TopicSelectSectionProps) => {
    const topicComboboxAnchor = useComboboxAnchor()

    return (
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
    )
}
