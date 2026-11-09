import { queryOptions, useQuery } from '@tanstack/vue-query';
import { api } from '@/shared/api';
import type { ShiftTemplate } from '../model/types';

export const shiftTemplateKeys = {
    all: ['shift-templates'] as const,
};

export function fetchShiftTemplates(): Promise<ShiftTemplate[]> {
    return api<{ data: ShiftTemplate[] }>('/shift-templates').then(
        (r) => r.data,
    );
}

export const shiftTemplatesQueryOptions = queryOptions({
    queryKey: shiftTemplateKeys.all,
    queryFn: fetchShiftTemplates,
    staleTime: 5 * 60_000,
});

export const useShiftTemplatesQuery = () =>
    useQuery(shiftTemplatesQueryOptions);
