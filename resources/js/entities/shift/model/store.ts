import { useManualRefHistory } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { ISODate } from '@/shared/lib/date';
import { durationMinutes } from '@/shared/lib/time';
import { cellKey, parseCellKey } from '../lib/cell-key';
import type { CellKey, Shift, ShiftTime } from './types';

type ShiftMap = Map<CellKey, Shift>;

const sameShift = (a: Shift | undefined, b: Shift) =>
    a !== undefined &&
    a.start === b.start &&
    a.end === b.end &&
    a.templateId === b.templateId;

const serialize = (shifts: ShiftMap) =>
    JSON.stringify(
        [...shifts.values()]
            .map(
                (s) =>
                    `${cellKey(s.employeeId, s.date)}|${s.start}|${s.end}|${s.templateId}`,
            )
            .sort(),
    );

/**
 * Черновик графика, который редактирует пользователь. Серверное состояние живёт
 * в кэше Vue Query, сюда оно попадает через load() и уходит обратно по «Сохранить».
 *
 * Смены лежат в Map по ключу ячейки, чтобы ячейка находила свою смену за O(1),
 * а не перебором массива. Каждая правка создаёт новую Map — поэтому снапшоты
 * истории не делят данные между собой, и undo/redo работает без глубокого клонирования.
 */
export const useScheduleStore = defineStore('schedule', () => {
    const shifts = shallowRef<ShiftMap>(new Map());
    const loadedPeriod = ref<string | null>(null);
    const savedSnapshot = ref(serialize(shifts.value));

    const history = useManualRefHistory(shifts, { capacity: 100 });

    // вернул всё как было — и индикатор несохранённых изменений гаснет
    const isDirty = computed(
        () => serialize(shifts.value) !== savedSnapshot.value,
    );

    // покрытие считается по всем сотрудникам, а не только по найденным поиском:
    // оно описывает график, а не то, что сейчас на экране
    const coverage = computed(() => {
        const counts = new Map<ISODate, number>();
        for (const s of shifts.value.values()) {
            counts.set(s.date, (counts.get(s.date) ?? 0) + 1);
        }
        return counts;
    });

    const minutesByEmployee = computed(() => {
        const totals = new Map<number, number>();
        for (const s of shifts.value.values()) {
            totals.set(
                s.employeeId,
                (totals.get(s.employeeId) ?? 0) +
                    durationMinutes(s.start, s.end),
            );
        }
        return totals;
    });

    function load(list: Shift[], period: string) {
        shifts.value = new Map(
            list.map((s) => [
                cellKey(s.employeeId, s.date),
                {
                    employeeId: s.employeeId,
                    date: s.date,
                    start: s.start,
                    end: s.end,
                    templateId: s.templateId,
                },
            ]),
        );
        loadedPeriod.value = period;
        savedSnapshot.value = serialize(shifts.value);
        // commit делает загруженное состояние точкой отсчёта, clear выкидывает историю прошлого периода
        history.commit();
        history.clear();
    }

    // fn возвращает, поменялось ли что-то: пустые операции не засоряют историю
    function mutate(fn: (draft: ShiftMap) => boolean) {
        const next = new Map(shifts.value);
        if (!fn(next)) return;
        shifts.value = next;
        history.commit();
    }

    function assign(
        keys: Iterable<CellKey>,
        time: ShiftTime,
        templateId: number | null,
    ) {
        mutate((draft) => {
            let changed = false;
            for (const key of keys) {
                const shift = {
                    ...parseCellKey(key),
                    start: time.start,
                    end: time.end,
                    templateId,
                };
                if (sameShift(draft.get(key), shift)) continue;
                draft.set(key, shift);
                changed = true;
            }
            return changed;
        });
    }

    function clear(keys: Iterable<CellKey>) {
        mutate((draft) => {
            let changed = false;
            for (const key of keys) changed = draft.delete(key) || changed;
            return changed;
        });
    }

    function move(from: CellKey, to: CellKey, copy = false) {
        const shift = shifts.value.get(from);
        if (!shift || from === to) return;

        mutate((draft) => {
            if (!copy) draft.delete(from);
            draft.set(to, { ...shift, ...parseCellKey(to) });
            return true;
        });
    }

    const list = (): Shift[] => [...shifts.value.values()];

    return {
        shifts,
        loadedPeriod,
        isDirty,
        coverage,
        minutesByEmployee,
        load,
        assign,
        clear,
        move,
        list,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
    };
});
