import { durationMinutes, formatHours } from '@/shared/lib/time';
import type { ShiftColor } from '../model/colors';
import type { Shift } from '../model/types';

type TemplateLike = { name: string; color: ShiftColor };

export function shiftChipProps(
    shift: Shift,
    template: TemplateLike | undefined,
): { color: ShiftColor; time: string; hours: string; title: string } {
    const time = `${shift.start} - ${shift.end}`;
    const hours = formatHours(durationMinutes(shift.start, shift.end));

    return {
        color: template?.color ?? 'info',
        time,
        hours,
        title: `${template?.name ?? 'Своя смена'}: ${time} · ${hours}`,
    };
}
