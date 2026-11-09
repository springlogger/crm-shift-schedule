import { queryOptions, useQuery } from '@tanstack/vue-query';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { api } from '@/shared/api';
import type { DateRange } from '@/shared/lib/date';
import type { Shift, ShiftRecord } from '../model/types';

type ShiftsResponse = { data: ShiftRecord[] };

export const shiftKeys = {
    all: ['shifts'] as const,
    period: (range: DateRange) => ['shifts', range.from, range.to] as const,
};

const periodQuery = (range: DateRange) =>
    new URLSearchParams({ from: range.from, to: range.to }).toString();

export const shiftsApi = {
    list: (range: DateRange) =>
        api<ShiftsResponse>(`/shifts?${periodQuery(range)}`).then(
            (r) => r.data,
        ),

    // полная замена смен периода: сервер сам считает, что удалить, добавить и обновить
    sync: (range: DateRange, shifts: Shift[]) =>
        api<ShiftsResponse>('/shifts/sync', {
            method: 'PUT',
            body: JSON.stringify({
                from: range.from,
                to: range.to,
                shifts: shifts.map((s) => ({
                    employee_id: s.employeeId,
                    date: s.date,
                    start: s.start,
                    end: s.end,
                    template_id: s.templateId,
                })),
            }),
        }).then((r) => r.data),

    publish: (range: DateRange) =>
        api<ShiftsResponse>('/shifts/publish', {
            method: 'POST',
            body: JSON.stringify({ from: range.from, to: range.to }),
        }).then((r) => r.data),
};

// минута свежести: график редко правят двое одновременно, а при возврате
// на уже открытый период он показывается из кэша мгновенно, без лоадера
export const shiftsQueryOptions = (range: DateRange) =>
    queryOptions({
        queryKey: shiftKeys.period(range),
        queryFn: () => shiftsApi.list(range),
        staleTime: 60_000,
    });

export const useShiftsQuery = (range: MaybeRefOrGetter<DateRange>) =>
    useQuery(computed(() => shiftsQueryOptions(toValue(range))));
