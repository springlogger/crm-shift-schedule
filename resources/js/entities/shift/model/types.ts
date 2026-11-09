import type { ISODate } from '@/shared/lib/date';

// время в формате "HH:MM"; конец раньше начала — смена через полночь
export type ShiftTime = { start: string; end: string };

export type ShiftStatus = 'draft' | 'published';

// время копируется из шаблона в саму смену: правка шаблона не меняет уже назначенные смены,
// а templateId нужен только для цвета; null — «своя смена»
export type Shift = ShiftTime & {
    employeeId: number;
    date: ISODate;
    templateId: number | null;
};

export type ShiftRecord = Shift & { status: ShiftStatus };

export type CellKey = `${number}:${ISODate}`;
