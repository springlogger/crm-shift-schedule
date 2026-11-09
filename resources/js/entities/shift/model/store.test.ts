import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { cellKey } from '../lib/cell-key';
import { useScheduleStore } from './store';
import type { Shift } from './types';

const morning = { start: '07:00', end: '15:00' };
const a = cellKey(1, '2026-11-02');
const b = cellKey(2, '2026-11-02');
const c = cellKey(1, '2026-11-03');

const saved: Shift[] = [
    {
        employeeId: 1,
        date: '2026-11-02',
        start: '10:00',
        end: '18:00',
        templateId: 2,
    },
];

describe('useScheduleStore', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('покрытие и часы пересчитываются при назначении и очистке', () => {
        const store = useScheduleStore();

        store.assign([a, b], morning, 1);
        expect(store.coverage.get('2026-11-02')).toBe(2);
        expect(store.minutesByEmployee.get(1)).toBe(480);

        store.clear([a]);
        expect(store.coverage.get('2026-11-02')).toBe(1);
        expect(store.minutesByEmployee.get(1)).toBeUndefined();
    });

    it('isDirty гаснет, если вернуть всё как было', () => {
        const store = useScheduleStore();
        store.load(saved, 'week');
        expect(store.isDirty).toBe(false);

        store.assign([a], morning, 1);
        expect(store.isDirty).toBe(true);

        store.assign([a], { start: '10:00', end: '18:00' }, 2);
        expect(store.isDirty).toBe(false);
    });

    it('undo/redo откатывают правки, но не дальше загруженного состояния', () => {
        const store = useScheduleStore();
        store.assign([b], morning, 1);
        store.load(saved, 'week');
        expect(store.canUndo).toBe(false);

        store.assign([b], morning, 1);
        store.clear([a]);
        store.undo();
        expect(store.shifts.has(a)).toBe(true);
        store.undo();
        expect(store.shifts.has(b)).toBe(false);
        expect(store.canUndo).toBe(false);

        store.redo();
        expect(store.shifts.get(b)?.start).toBe('07:00');
    });

    it('пустые операции не попадают в историю', () => {
        const store = useScheduleStore();
        store.load(saved, 'week');

        store.clear([b]);
        store.assign([a], { start: '10:00', end: '18:00' }, 2);
        expect(store.canUndo).toBe(false);
    });

    it('move переносит смену, а с copy — копирует', () => {
        const store = useScheduleStore();
        store.load(saved, 'week');

        store.move(a, c);
        expect(store.shifts.has(a)).toBe(false);
        expect(store.shifts.get(c)).toMatchObject({
            employeeId: 1,
            date: '2026-11-03',
            templateId: 2,
        });

        store.move(c, b, true);
        expect(store.shifts.has(c)).toBe(true);
        expect(store.shifts.get(b)?.employeeId).toBe(2);
    });
});
