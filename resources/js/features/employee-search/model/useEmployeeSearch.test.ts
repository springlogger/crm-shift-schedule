import { describe, expect, it } from 'vite-plus/test';
import type { Employee } from '@/entities/employee';
import { useEmployeeSearch } from './useEmployeeSearch';

const person = (id: number, surname: string, name: string): Employee => ({
    id,
    surname,
    name,
    position: 'агент',
    hours: 24,
});

const employees = [
    person(1, 'Кузнецова', 'Алина'),
    person(2, 'Соколов', 'Артём'),
    person(3, 'Волков', 'Тимур'),
];

function search(query: string) {
    const s = useEmployeeSearch(employees);
    s.query.value = query;
    return s.filtered.value.map((e) => e.id);
}

describe('useEmployeeSearch', () => {
    it('пустой запрос показывает всех', () => {
        expect(search('   ')).toEqual([1, 2, 3]);
    });

    it('ищет по части имени и фамилии в любом порядке', () => {
        expect(search('алин')).toEqual([1]);
        expect(search('алин кузн')).toEqual([1]);
    });

    it('не различает «е» и «ё»', () => {
        expect(search('артем')).toEqual([2]);
    });

    it('ничего не находит по чужим словам', () => {
        expect(search('волк алина')).toEqual([]);
    });
});
