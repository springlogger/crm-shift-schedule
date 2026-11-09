import { describe, expect, it } from 'vite-plus/test';
import { periodLabel, periodRange, shiftAnchor } from './period';

describe('periodRange', () => {
    it('неделя — 7 дней с понедельника', () => {
        const range = periodRange('2026-11-05', 'week');

        expect(range.days).toHaveLength(7);
        expect(range.from).toBe('2026-11-02');
        expect(range.to).toBe('2026-11-08');
    });

    it('воскресенье относится к уходящей неделе', () => {
        expect(periodRange('2026-11-08', 'week').from).toBe('2026-11-02');
    });

    it('неделя на стыке месяцев', () => {
        const range = periodRange('2026-12-01', 'week');

        expect(range.from).toBe('2026-11-30');
        expect(range.to).toBe('2026-12-06');
    });

    it('месяц — все его дни', () => {
        expect(periodRange('2026-11-17', 'month').days).toHaveLength(30);
        expect(periodRange('2028-02-10', 'month').days).toHaveLength(29);
    });
});

describe('shiftAnchor', () => {
    it('листает неделями и месяцами', () => {
        expect(shiftAnchor('2026-11-05', 'week', 1)).toBe('2026-11-12');
        expect(shiftAnchor('2026-11-05', 'week', -1)).toBe('2026-10-29');
        expect(shiftAnchor('2026-01-31', 'month', 1)).toBe('2026-02-28');
    });
});

describe('periodLabel', () => {
    it('подписывает неделю и месяц', () => {
        expect(periodLabel(periodRange('2026-11-05', 'week'), 'week')).toBe(
            '2 – 8 ноября 2026',
        );
        expect(periodLabel(periodRange('2026-12-01', 'week'), 'week')).toBe(
            '30 нояб. – 6 дек. 2026',
        );
        expect(periodLabel(periodRange('2026-11-05', 'month'), 'month')).toBe(
            'Ноябрь 2026',
        );
    });
});
