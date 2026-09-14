import {Dispatch, SetStateAction} from 'react'
import {Checkbox} from "@bsg/ui/checkbox"
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@bsg/ui/field"

type ProblemListSectionProps = {
    blind75: boolean;
    setBlind75: Dispatch<SetStateAction<boolean>>;
    neetcode150: boolean;
    setNeetcode150: Dispatch<SetStateAction<boolean>>;
};

// Curated problem lists - restricts the pool to a well-known set.
export const ProblemListSection = ({
    blind75,
    setBlind75,
    neetcode150,
    setNeetcode150,
}: ProblemListSectionProps) => (
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
)
