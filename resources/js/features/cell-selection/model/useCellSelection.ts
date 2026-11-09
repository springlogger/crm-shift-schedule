import { useEventListener } from '@vueuse/core';
import { computed, shallowRef, toValue, type MaybeRefOrGetter } from 'vue';
import { cellKey, parseCellKey, type CellKey } from '@/entities/shift';
import type { ISODate } from '@/shared/lib/date';

export type CellPoint = { row: number; col: number };

type PointerLike = Pick<
    PointerEvent,
    'button' | 'ctrlKey' | 'metaKey' | 'shiftKey'
> &
    Partial<Pick<PointerEvent, 'clientX' | 'clientY'>>;

type PointerPosition = Partial<Pick<PointerEvent, 'clientX' | 'clientY'>>;

// меньше этого сдвига — не протягивание, а дрожание руки или сдвиг вёрстки под курсором
const DRAG_THRESHOLD_PX = 4;

// прямоугольник строится по индексам в видимом порядке (строки — найденные сотрудники, колонки — дни),
// а не по id: иначе при активном поиске в выделение попадали бы скрытые строки
export function cellsInRect(
    a: CellPoint,
    b: CellPoint,
    rowIds: readonly number[],
    days: readonly ISODate[],
): CellKey[] {
    const keys: CellKey[] = [];
    for (
        let row = Math.min(a.row, b.row);
        row <= Math.max(a.row, b.row);
        row++
    ) {
        for (
            let col = Math.min(a.col, b.col);
            col <= Math.max(a.col, b.col);
            col++
        ) {
            keys.push(cellKey(rowIds[row], days[col]));
        }
    }
    return keys;
}

export function selectionSummary(keys: Iterable<CellKey>) {
    const employees = new Set<number>();
    const dates = new Set<ISODate>();
    let cells = 0;
    for (const key of keys) {
        const { employeeId, date } = parseCellKey(key);
        employees.add(employeeId);
        dates.add(date);
        cells++;
    }
    return { cells, employees: employees.size, days: dates.size };
}

/**
 * Выделение как в таблицах:
 * - нажал и протянул — прямоугольник;
 * - Ctrl/Cmd + протянуть — добавить прямоугольник к выделению
 *   (если начал с уже выделенной ячейки — наоборот, снять);
 * - Shift + клик — прямоугольник от предыдущей ячейки до этой.
 *
 * Живёт отдельно от store смен, чтобы undo не откатывало выделение.
 */
export function useCellSelection(
    rowIds: MaybeRefOrGetter<readonly number[]>,
    days: MaybeRefOrGetter<readonly ISODate[]>,
) {
    const selected = shallowRef(new Set<CellKey>());
    const dragging = shallowRef(false);
    let anchor: CellPoint | null = null;
    let base = new Set<CellKey>();
    let subtract = false;
    let origin: PointerPosition = {};

    const rect = (a: CellPoint, b: CellPoint) =>
        cellsInRect(a, b, toValue(rowIds), toValue(days));

    function applyRect(to: CellPoint) {
        if (!anchor) return;
        const next = new Set(base);
        for (const key of rect(anchor, to)) {
            if (subtract) next.delete(key);
            else next.add(key);
        }
        selected.value = next;
    }

    function pointerDown(point: CellPoint, event: PointerLike) {
        if (event.button !== 0) return;
        const additive = event.ctrlKey || event.metaKey;

        if (event.shiftKey && anchor) {
            base = additive ? new Set(selected.value) : new Set();
            subtract = false;
            applyRect(point);
            return;
        }

        const key = cellKey(
            toValue(rowIds)[point.row],
            toValue(days)[point.col],
        );
        subtract = additive && selected.value.has(key);
        base = additive ? new Set(selected.value) : new Set();
        anchor = point;
        origin = { clientX: event.clientX, clientY: event.clientY };
        dragging.value = true;
        applyRect(point);
    }

    // если таблица сдвинулась под неподвижным курсором, браузер тоже шлёт pointerenter —
    // такое событие не должно растягивать выделение на соседнюю ячейку
    function movedEnough(event: PointerPosition) {
        if (
            event.clientX === undefined ||
            event.clientY === undefined ||
            origin.clientX === undefined ||
            origin.clientY === undefined
        ) {
            return true;
        }
        return (
            Math.hypot(
                event.clientX - origin.clientX,
                event.clientY - origin.clientY,
            ) >= DRAG_THRESHOLD_PX
        );
    }

    function pointerEnter(point: CellPoint, event: PointerPosition = {}) {
        if (dragging.value && movedEnough(event)) applyRect(point);
    }

    // клавиатурный доступ: Enter/Space на ячейке добавляет её к выделению или снимает
    function toggle(point: CellPoint) {
        const key = cellKey(
            toValue(rowIds)[point.row],
            toValue(days)[point.col],
        );
        const next = new Set(selected.value);
        if (!next.delete(key)) next.add(key);
        anchor = point;
        selected.value = next;
    }

    function retain(predicate: (key: CellKey) => boolean) {
        const next = new Set([...selected.value].filter(predicate));
        if (next.size !== selected.value.size) selected.value = next;
    }

    function reset() {
        selected.value = new Set();
        anchor = null;
    }

    // dragstart: нативный DnD смены глотает pointerup, без этого протягивание «залипло» бы
    useEventListener(['pointerup', 'pointercancel', 'dragstart'], () => {
        dragging.value = false;
    });

    const summary = computed(() => selectionSummary(selected.value));

    return {
        selected,
        dragging,
        summary,
        pointerDown,
        pointerEnter,
        toggle,
        retain,
        reset,
    };
}
