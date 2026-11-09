<script setup lang="ts">
import { computed } from 'vue';
import { EmployeeCell, type Employee } from '@/entities/employee';
import {
    cellKey,
    ShiftChip,
    shiftChipProps,
    type CellKey,
    type Shift,
} from '@/entities/shift';
import type { ShiftTemplate } from '@/entities/shift-template';
import type { CellPoint } from '@/features/cell-selection';
import type { SchedulePeriod } from '@/features/period-navigation';
import {
    startDrag,
    useDropTarget,
    type DragPayload,
} from '@/features/shift-dnd';
import { cn } from '@/shared/lib/cn';
import { fromISODate, todayISO, type ISODate } from '@/shared/lib/date';
import CoverageCell from './CoverageCell.vue';
import DayHeader from './DayHeader.vue';
import ScheduleCell from './ScheduleCell.vue';

const props = defineProps<{
    employees: Employee[];
    days: ISODate[];
    period: SchedulePeriod;
    shifts: ReadonlyMap<CellKey, Shift>;
    templates: ShiftTemplate[];
    selected: ReadonlySet<CellKey>;
    coverage: ReadonlyMap<ISODate, number>;
    minutesByEmployee: ReadonlyMap<number, number>;
    loading?: boolean;
    selecting?: boolean;
}>();

const emit = defineEmits<{
    'cell-pointerdown': [point: CellPoint, event: PointerEvent];
    'cell-pointerenter': [point: CellPoint, event: PointerEvent];
    'cell-toggle': [point: CellPoint];
    'quick-assign': [date: ISODate, template: ShiftTemplate];
    drop: [payload: DragPayload, target: CellKey, copy: boolean];
}>();

const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

const today = todayISO();

const columns = computed(() =>
    props.days.map((date) => {
        const value = fromISODate(date);
        return {
            date,
            weekday: weekdayFormat.format(value),
            day: value.getDate(),
        };
    }),
);

const templatesById = computed(
    () => new Map(props.templates.map((t) => [t.id, t])),
);

const compact = computed(() => props.period === 'month');

// в месяце колонок 28–31, поэтому ячейки уже, а чип показывает только длительность
const gridStyle = computed(() => ({
    '--days': props.days.length,
    '--cell-min': compact.value
        ? 'calc(var(--spacing) * 14)'
        : 'calc(var(--spacing) * 27.5)',
}));

// норма в данных недельная; за месяц считаем пропорционально числу дней
const normHours = (employee: Employee) =>
    Math.round((employee.hours * props.days.length) / 7);

const assignedHours = (employee: Employee) =>
    (props.minutesByEmployee.get(employee.id) ?? 0) / 60;

const chip = (shift: Shift) =>
    shiftChipProps(
        shift,
        shift.templateId === null
            ? undefined
            : templatesById.value.get(shift.templateId),
    );

const { overKey, dragOver, dragLeave, drop } = useDropTarget(
    (payload, target, copy) => emit('drop', payload, target, copy),
);
</script>

<template>
    <div class="min-w-0 rounded-2xl bg-backgrounds-primary px-3 pt-3">
        <!-- высота фиксирована: шапка и плашка выделения сменяют друг друга,
             и если бы высота менялась, таблица прыгала бы под курсором посреди выделения -->
        <header class="mb-5 h-13">
            <slot name="header" />
        </header>

        <div class="w-full overflow-x-auto overscroll-x-contain pb-3">
            <div
                role="grid"
                aria-multiselectable="true"
                :aria-busy="loading || undefined"
                :class="
                    cn(
                        'grid w-max min-w-full grid-cols-[--spacing(55)_repeat(var(--days),minmax(var(--cell-min),1fr))]',
                        selecting && 'select-none',
                    )
                "
                :style="gridStyle"
            >
                <div
                    class="sticky left-0 z-20 flex h-12 items-center border-b border-border-neutral-subtle bg-backgrounds-primary p-3"
                >
                    <span class="text-m text-text-secondary">Сотрудник</span>
                </div>

                <div
                    v-for="column in columns"
                    :key="column.date"
                    role="columnheader"
                    :class="
                        cn(
                            'flex h-12 items-center justify-center border-b border-border-neutral-subtle text-m whitespace-nowrap text-text-secondary',
                            compact ? 'px-0.5' : 'p-3',
                        )
                    "
                >
                    <DayHeader
                        :weekday="column.weekday"
                        :day="column.day"
                        :is-today="column.date === today"
                        :templates="templates"
                        @assign="emit('quick-assign', column.date, $event)"
                    />
                </div>

                <template v-if="loading">
                    <template v-for="row in 5" :key="`skeleton-${row}`">
                        <div
                            class="sticky left-0 z-10 flex items-center gap-2 bg-backgrounds-primary py-3 pr-3 pl-2"
                        >
                            <span
                                class="size-10 shrink-0 animate-pulse rounded-xs bg-backgrounds-tertiary"
                            />
                            <span
                                class="h-4 flex-1 animate-pulse rounded-xs bg-backgrounds-tertiary"
                            />
                        </div>
                        <div
                            v-for="column in columns"
                            :key="`skeleton-${row}-${column.date}`"
                            class="h-18 p-1"
                        >
                            <div
                                class="size-full animate-pulse rounded-m bg-backgrounds-quaternary"
                            />
                        </div>
                    </template>
                </template>

                <div
                    v-else-if="!employees.length"
                    class="col-span-full flex h-36 items-center justify-center text-m text-text-secondary"
                >
                    <slot name="empty">Сотрудников пока нет</slot>
                </div>

                <template v-else>
                    <template
                        v-for="(employee, row) in employees"
                        :key="employee.id"
                    >
                        <div
                            role="rowheader"
                            :class="
                                cn(
                                    'sticky left-0 z-10 min-w-0',
                                    row % 2
                                        ? 'bg-backgrounds-secondary'
                                        : 'bg-backgrounds-primary',
                                )
                            "
                        >
                            <EmployeeCell
                                :name="employee.name"
                                :surname="employee.surname"
                                :position="employee.position"
                                :hours="normHours(employee)"
                                :assigned-hours="assignedHours(employee)"
                                :avatar-url="employee.avatarUrl"
                            />
                        </div>

                        <div
                            v-for="(column, col) in columns"
                            :key="column.date"
                            role="gridcell"
                            tabindex="0"
                            :aria-selected="
                                selected.has(cellKey(employee.id, column.date))
                            "
                            :aria-label="`${employee.surname} ${employee.name}, ${column.weekday} ${column.day}`"
                            :class="
                                cn(
                                    'min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-border-brand-strong focus-visible:ring-inset',
                                    row % 2 && 'bg-backgrounds-secondary',
                                )
                            "
                            @pointerdown="
                                emit('cell-pointerdown', { row, col }, $event)
                            "
                            @pointerenter="
                                emit('cell-pointerenter', { row, col }, $event)
                            "
                            @keydown.enter.prevent="
                                emit('cell-toggle', { row, col })
                            "
                            @keydown.space.prevent="
                                emit('cell-toggle', { row, col })
                            "
                            @dragover="
                                dragOver(
                                    $event,
                                    cellKey(employee.id, column.date),
                                )
                            "
                            @dragleave="dragLeave"
                            @drop="
                                drop($event, cellKey(employee.id, column.date))
                            "
                        >
                            <ScheduleCell
                                :selected="
                                    selected.has(
                                        cellKey(employee.id, column.date),
                                    )
                                "
                                :drop-target="
                                    overKey ===
                                    cellKey(employee.id, column.date)
                                "
                                :filled="
                                    shifts.has(
                                        cellKey(employee.id, column.date),
                                    )
                                "
                            >
                                <ShiftChip
                                    v-if="
                                        shifts.get(
                                            cellKey(employee.id, column.date),
                                        )
                                    "
                                    v-bind="
                                        chip(
                                            shifts.get(
                                                cellKey(
                                                    employee.id,
                                                    column.date,
                                                ),
                                            )!,
                                        )
                                    "
                                    :compact="compact"
                                    draggable="true"
                                    class="cursor-grab active:cursor-grabbing"
                                    @dragstart="
                                        startDrag($event, {
                                            kind: 'shift',
                                            from: cellKey(
                                                employee.id,
                                                column.date,
                                            ),
                                        })
                                    "
                                />
                            </ScheduleCell>
                        </div>
                    </template>
                </template>

                <div
                    class="sticky left-0 z-20 flex items-center border-t border-border-neutral-subtle bg-backgrounds-primary p-3"
                >
                    <span class="text-m text-text-secondary">Покрытие</span>
                </div>

                <CoverageCell
                    v-for="column in columns"
                    :key="column.date"
                    :count="coverage.get(column.date) ?? 0"
                />
            </div>
        </div>
    </div>
</template>
