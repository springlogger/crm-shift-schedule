import type { ShiftColor, ShiftTime } from '@/entities/shift';

export type ShiftTemplate = ShiftTime & {
    id: number;
    name: string;
    color: ShiftColor;
};
