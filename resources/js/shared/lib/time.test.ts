import { describe, expect, it } from 'vite-plus/test';
import { durationMinutes, formatHours, isValidTime, maskTime } from './time';

describe('durationMinutes', () => {
    it.each([
        ['07:00', '15:00', 480],
        ['15:00', '23:00', 480],
        ['08:00', '18:00', 600],
        ['22:00', '06:00', 480],
        ['09:30', '17:00', 450],
        ['23:30', '00:15', 45],
    ])('%s–%s → %i мин', (start, end, expected) => {
        expect(durationMinutes(start, end)).toBe(expected);
    });

    // такой ввод запрещён валидацией и на фронте, и на бэке; функция трактует его как сутки
    it('считает совпадающие начало и конец за 24 часа', () => {
        expect(durationMinutes('09:00', '09:00')).toBe(1440);
    });
});

describe('formatHours', () => {
    it('форматирует по-русски и без лишних нулей', () => {
        expect(formatHours(480)).toBe('8 ч');
        expect(formatHours(450)).toBe('7,5 ч');
    });
});

describe('maskTime / isValidTime', () => {
    it('сам ставит двоеточие', () => {
        expect(maskTime('0730')).toBe('07:30');
        expect(maskTime('7')).toBe('7');
        expect(maskTime('07:3a0')).toBe('07:30');
    });

    it('пропускает только HH:MM в пределах суток', () => {
        expect(isValidTime('23:59')).toBe(true);
        expect(isValidTime('24:00')).toBe(false);
        expect(isValidTime('7:00')).toBe(false);
    });
});
