import { format, isValid, parseISO } from 'date-fns';

// даты везде строки "YYYY-MM-DD": new Date('2026-11-02') парсится как UTC-полночь
// и западнее Гринвича уезжает на день назад, а строку можно сразу брать ключом Map
export type ISODate = string;

export type DateRange = { from: ISODate; to: ISODate };

export function toISODate(date: Date): ISODate {
    return format(date, 'yyyy-MM-dd');
}

// parseISO из date-fns читает дату без времени как локальную полночь
export function fromISODate(date: ISODate): Date {
    return parseISO(date);
}

export function isISODate(value: unknown): value is ISODate {
    return (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        isValid(parseISO(value))
    );
}

export function todayISO(): ISODate {
    return toISODate(new Date());
}
