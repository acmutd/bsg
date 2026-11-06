import React, {Dispatch, SetStateAction} from 'react'
import {Label} from "@bsg/ui/label"
import {Checkbox} from "@bsg/ui/checkbox"
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

type CompanySelectSectionProps = {
    companies: string[];
    selectedCompanies: string[];
    setSelectedCompanies: Dispatch<SetStateAction<string[]>>;
    recentlyAsked: boolean;
    setRecentlyAsked: Dispatch<SetStateAction<boolean>>;
};

// Company filter. "Recently asked" narrows to the last interview window and only
// means anything alongside a company, so it stays disabled until one is picked.
export const CompanySelectSection = ({
    companies,
    selectedCompanies,
    setSelectedCompanies,
    recentlyAsked,
    setRecentlyAsked,
}: CompanySelectSectionProps) => {
    const companyComboboxAnchor = useComboboxAnchor()
    const hasCompanySelected = selectedCompanies.length > 0

    return (
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
                              disabled={!hasCompanySelected}/>
                    <Label
                        className={`text-sm text-foreground ${!hasCompanySelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        onClick={() => hasCompanySelected && setRecentlyAsked((prev) => !prev)}>
                        Recently asked
                    </Label>
                </div>
            </div>
        </div>
    )
}
