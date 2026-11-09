import type { ISODate } from '@/shared/lib/date';
import type { CellKey } from '../model/types';

export const cellKey = (employeeId: number, date: ISODate): CellKey =>
    `${employeeId}:${date}`;

export function parseCellKey(key: CellKey): {
    employeeId: number;
    date: ISODate;
} {
    const separator = key.indexOf(':');

    return {
        employeeId: Number(key.slice(0, separator)),
        date: key.slice(separator + 1),
    };
}
