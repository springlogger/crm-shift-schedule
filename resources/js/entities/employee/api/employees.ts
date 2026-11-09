import { queryOptions, useQuery } from '@tanstack/vue-query';
import { api } from '@/shared/api';
import type { Employee } from '../model/types';

export const employeeKeys = {
    all: ['employees'] as const,
};

export function fetchEmployees(): Promise<Employee[]> {
    return api<{ data: Employee[] }>('/employees').then((r) => r.data);
}

// справочник меняется редко, поэтому держим его свежим дольше, чем смены
export const employeesQueryOptions = queryOptions({
    queryKey: employeeKeys.all,
    queryFn: fetchEmployees,
    staleTime: 5 * 60_000,
});

export const useEmployeesQuery = () => useQuery(employeesQueryOptions);
