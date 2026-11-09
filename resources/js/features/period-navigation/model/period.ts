import {
    addMonths,
    addWeeks,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isSameYear,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    fromISODate,
    toISODate,
    type DateRange,
    type ISODate,
} from '@/shared/lib/date';

export type SchedulePeriod = 'week' | 'month';

export type PeriodRange = DateRange & { days: ISODate[] };

export const schedulePeriods: { value: SchedulePeriod; label: string }[] = [
    { value: 'month', label: 'Месяц' },
    { value: 'week', label: 'Неделя' },
];

export function isSchedulePeriod(value: unknown): value is SchedulePeriod {
    return value === 'week' || value === 'month';
}

export function periodRange(
    anchor: ISODate,
    period: SchedulePeriod,
): PeriodRange {
    const date = fromISODate(anchor);
    // weekStartsOn: 1 — неделя с понедельника, по умолчанию date-fns начинает с воскресенья
    const start =
        period === 'week'
            ? startOfWeek(date, { weekStartsOn: 1 })
            : startOfMonth(date);
    const end =
        period === 'week'
            ? endOfWeek(date, { weekStartsOn: 1 })
            : endOfMonth(date);
    const days = eachDayOfInterval({ start, end }).map(toISODate);

    return { from: days[0], to: days[days.length - 1], days };
}

export function shiftAnchor(
    anchor: ISODate,
    period: SchedulePeriod,
    step: number,
): ISODate {
    const date = fromISODate(anchor);

    return toISODate(
        period === 'week' ? addWeeks(date, step) : addMonths(date, step),
    );
}

export function periodKey(range: DateRange): string {
    return `${range.from}_${range.to}`;
}

export function periodLabel(range: DateRange, period: SchedulePeriod): string {
    const from = fromISODate(range.from);
    const to = fromISODate(range.to);

    if (period === 'month') {
        const label = format(from, 'LLLL yyyy', { locale: ru });

        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (isSameMonth(from, to)) {
        return `${format(from, 'd')} – ${format(to, 'd MMMM yyyy', { locale: ru })}`;
    }

    const fromFormat = isSameYear(from, to) ? 'd MMM' : 'd MMM yyyy';

    return `${format(from, fromFormat, { locale: ru })} – ${format(to, 'd MMM yyyy', { locale: ru })}`;
}
