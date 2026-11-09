import { describe, expect, it } from 'vite-plus/test';
import {
    cellsInRect,
    selectionSummary,
    useCellSelection,
} from './useCellSelection';

const rows = [10, 20, 30];
const days = ['2026-11-02', '2026-11-03', '2026-11-04'];

const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false };
const ctrl = { ...click, ctrlKey: true };
const shift = { ...click, shiftKey: true };

describe('cellsInRect', () => {
    it('строит прямоугольник в любом направлении протягивания', () => {
        const expected = [
            '10:2026-11-02',
            '10:2026-11-03',
            '20:2026-11-02',
            '20:2026-11-03',
        ];

        expect(
            cellsInRect({ row: 0, col: 0 }, { row: 1, col: 1 }, rows, days),
        ).toEqual(expected);
        expect(
            cellsInRect({ row: 1, col: 1 }, { row: 0, col: 0 }, rows, days),
        ).toEqual(expected);
    });
});

describe('selectionSummary', () => {
    it('считает ячейки, сотрудников и дни', () => {
        expect(
            selectionSummary([
                '10:2026-11-02',
                '10:2026-11-03',
                '20:2026-11-03',
            ]),
        ).toEqual({ cells: 3, employees: 2, days: 2 });
    });
});

describe('useCellSelection', () => {
    it('протягивание выделяет прямоугольник, новый клик его заменяет', () => {
        const s = useCellSelection(rows, days);

        s.pointerDown({ row: 0, col: 0 }, click);
        s.pointerEnter({ row: 1, col: 2 });
        expect(s.summary.value).toEqual({ cells: 6, employees: 2, days: 3 });

        s.pointerDown({ row: 2, col: 2 }, click);
        expect([...s.selected.value]).toEqual(['30:2026-11-04']);
    });

    it('Ctrl добавляет к выделению, а с выделенной ячейки — снимает', () => {
        const s = useCellSelection(rows, days);

        s.pointerDown({ row: 0, col: 0 }, click);
        s.pointerDown({ row: 2, col: 2 }, ctrl);
        expect(s.selected.value.size).toBe(2);

        s.pointerDown({ row: 0, col: 0 }, ctrl);
        expect([...s.selected.value]).toEqual(['30:2026-11-04']);
    });

    it('Shift выделяет от предыдущей ячейки', () => {
        const s = useCellSelection(rows, days);

        s.pointerDown({ row: 0, col: 0 }, click);
        s.pointerDown({ row: 2, col: 0 }, shift);
        expect(s.summary.value).toEqual({ cells: 3, employees: 3, days: 1 });
    });

    it('без зажатой кнопки наведение ничего не выделяет', () => {
        const s = useCellSelection(rows, days);

        s.pointerEnter({ row: 1, col: 1 });
        expect(s.selected.value.size).toBe(0);
    });

    it('сдвиг вёрстки под неподвижным курсором не растягивает выделение', () => {
        const s = useCellSelection(rows, days);

        s.pointerDown(
            { row: 0, col: 0 },
            { ...click, clientX: 100, clientY: 100 },
        );
        s.pointerEnter({ row: 1, col: 0 }, { clientX: 101, clientY: 100 });
        expect(s.selected.value.size).toBe(1);

        s.pointerEnter({ row: 1, col: 0 }, { clientX: 100, clientY: 140 });
        expect(s.selected.value.size).toBe(2);
    });

    it('retain убирает ячейки скрытых сотрудников', () => {
        const s = useCellSelection(rows, days);

        s.pointerDown({ row: 0, col: 0 }, click);
        s.pointerEnter({ row: 2, col: 0 });
        s.retain((key) => !key.startsWith('20:'));
        expect([...s.selected.value]).toEqual([
            '10:2026-11-02',
            '30:2026-11-02',
        ]);
    });
});
