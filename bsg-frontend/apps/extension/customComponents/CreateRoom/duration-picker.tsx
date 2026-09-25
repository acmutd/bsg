import {Label} from "@bsg/ui/label"
import {Slider} from "@bsg/ui/slider"

const MIN_DURATION = 5
const MAX_DURATION = 120
const STEP = 5

type DurationPickerProps = {
    duration: number;
    onDurationChange: (duration: number) => void;
};

// Round length in minutes - shared by both create-room tabs.
export const DurationPicker = ({duration, onDurationChange}: DurationPickerProps) => (
    <div className="space-y-1">
        <Label className="text-sm text-foreground/60">{duration} mins</Label>
        <Slider
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={STEP}
            value={[duration]}
            onValueChange={(v) => onDurationChange(v[0])}
            className="pt-2"
        />
    </div>
)
