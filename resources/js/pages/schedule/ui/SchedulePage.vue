<script lang="ts" setup>
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { onKeyStroke, useEventListener } from '@vueuse/core';
import { Redo2, Undo2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useEmployeesQuery } from '@/entities/employee';
import {
    cellKey,
    parseCellKey,
    shiftKeys,
    shiftsApi,
    shiftsQueryOptions,
    useScheduleStore,
    useShiftsQuery,
    type CellKey,
    type Shift,
    type ShiftRecord,
    type ShiftTime,
} from '@/entities/shift';
import {
    useShiftTemplatesQuery,
    type ShiftTemplate,
} from '@/entities/shift-template';
import { useCellSelection } from '@/features/cell-selection';
import { EmployeeSearch, useEmployeeSearch } from '@/features/employee-search';
import {
    isSchedulePeriod,
    PeriodNavigation,
    periodKey,
    periodLabel,
    periodRange,
    schedulePeriods,
    shiftAnchor,
    type SchedulePeriod,
} from '@/features/period-navigation';
import type { DragPayload } from '@/features/shift-dnd';
import { apiErrorMessage } from '@/shared/api';
import {
    isISODate,
    todayISO,
    type DateRange,
    type ISODate,
} from '@/shared/lib/date';
import { UiBackLink, UiBadge, UiButton, UiTabs } from '@/shared/ui';
import { ScheduleGrid } from '@/widgets/schedule-grid';
import { SelectionBar } from '@/widgets/selection-bar';
import { ShiftPanel } from '@/widgets/shift-panel';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const store = useScheduleStore();

// --- период и состояние в URL: ?view=week&date=2026-11-02&q=алина ---

const period = ref<SchedulePeriod>(
    isSchedulePeriod(route.query.view) ? route.query.view : 'week',
);
const anchor = ref<ISODate>(
    isISODate(route.query.date) ? route.query.date : todayISO(),
);
const range = computed(() => periodRange(anchor.value, period.value));
const currentKey = computed(() => periodKey(range.value));
const isCurrentPeriod = computed(() => range.value.days.includes(todayISO()));

const DISCARD_MESSAGE =
    'В графике есть несохранённые изменения. Уйти и потерять их?';
const confirmDiscard = () => !store.isDirty || window.confirm(DISCARD_MESSAGE);

// сеттер отклоняет смену вкладки, если пользователь передумал терять черновик
const periodModel = computed({
    get: () => period.value,
    set: (value: SchedulePeriod) => {
        if (value !== period.value && confirmDiscard()) period.value = value;
    },
});

function goTo(next: ISODate) {
    if (periodKey(periodRange(next, period.value)) === currentKey.value) return;
    if (confirmDiscard()) anchor.value = next;
}

// --- серверные данные ---

const employeesQuery = useEmployeesQuery();
const templatesQuery = useShiftTemplatesQuery();
const shiftsQuery = useShiftsQuery(range);

const employees = computed(() => employeesQuery.data.value ?? []);
const templates = computed(() => templatesQuery.data.value ?? []);
const records = computed<ShiftRecord[]>(() =>
    store.loadedPeriod === currentKey.value
        ? (shiftsQuery.data.value ?? [])
        : [],
);

// данные пришли — кладём в черновик. Фоновый рефетч того же периода
// не должен затирать несохранённые правки, а данные нового периода — должны
watch(
    [() => shiftsQuery.data.value, currentKey],
    ([data, key]) => {
        if (!data) return;
        if (store.loadedPeriod !== key || !store.isDirty) store.load(data, key);
    },
    { immediate: true },
);

// соседние периоды подгружаем заранее — стрелки переключают график без лоадера
watch(
    range,
    () => {
        for (const step of [-1, 1]) {
            const next = periodRange(
                shiftAnchor(anchor.value, period.value, step),
                period.value,
            );
            void queryClient.prefetchQuery(shiftsQueryOptions(next));
        }
    },
    { immediate: true },
);

const gridLoading = computed(
    () =>
        employeesQuery.isPending.value ||
        store.loadedPeriod !== currentKey.value,
);

const loadError = computed(
    () =>
        employeesQuery.error.value ??
        templatesQuery.error.value ??
        (store.loadedPeriod !== currentKey.value
            ? shiftsQuery.error.value
            : null),
);

function retry() {
    void employeesQuery.refetch();
    void templatesQuery.refetch();
    void shiftsQuery.refetch();
}

// --- поиск и выделение ---

const { query: search, filtered: visibleEmployees } =
    useEmployeeSearch(employees);
search.value = typeof route.query.q === 'string' ? route.query.q : '';

const visibleIds = computed(() => visibleEmployees.value.map((e) => e.id));
const selection = useCellSelection(visibleIds, () => range.value.days);

// выделение по скрытым поиском сотрудникам и по ушедшему периоду сбрасываем
watch(visibleIds, (ids) => {
    const visible = new Set(ids);
    selection.retain((key) => visible.has(parseCellKey(key).employeeId));
});
watch(currentKey, () => selection.reset());

watch([period, anchor, search], () => {
    void router.replace({
        query: {
            view: period.value,
            date: anchor.value,
            q: search.value || undefined,
        },
    });
});

// --- назначение смен: все способы сходятся в store.assign / clear / move ---

function requireSelection(): CellKey[] | null {
    if (selection.selected.value.size) return [...selection.selected.value];
    toast.info(
        'Сначала выделите ячейки в графике или перетащите шаблон на ячейку',
    );
    return null;
}

function assignTemplate(template: ShiftTemplate) {
    const keys = requireSelection();
    if (keys) store.assign(keys, template, template.id);
}

function assignCustom(shift: ShiftTime) {
    const keys = requireSelection();
    if (keys) store.assign(keys, shift, null);
}

function clearSelected() {
    store.clear(selection.selected.value);
}

// по дате назначаем только свободным видимым сотрудникам, чтобы не затирать уже поставленные смены
function quickAssign(date: ISODate, template: ShiftTemplate) {
    const keys = visibleIds.value
        .map((id) => cellKey(id, date))
        .filter((key) => !store.shifts.has(key));

    if (!keys.length) {
        toast.info('У всех сотрудников на этот день уже есть смена');
        return;
    }
    store.assign(keys, template, template.id);
}

function onDrop(payload: DragPayload, target: CellKey, copy: boolean) {
    if (payload.kind === 'shift') {
        store.move(payload.from, target, copy);
        return;
    }

    const template = templates.value.find((t) => t.id === payload.templateId);
    if (!template) return;
    // бросили шаблон на выделенную ячейку — назначаем во всё выделение
    const keys = selection.selected.value.has(target)
        ? selection.selected.value
        : [target];
    store.assign(keys, template, template.id);
}

// --- сохранение и публикация ---

function putIntoCache(target: DateRange, data: ShiftRecord[]) {
    // неделя и месяц пересекаются: остальные закэшированные периоды помечаем устаревшими
    void queryClient.invalidateQueries({
        queryKey: shiftKeys.all,
        refetchType: 'none',
    });
    queryClient.setQueryData(shiftKeys.period(target), data);
    // пока шёл запрос, пользователь мог уйти на другой период — тогда черновик не трогаем
    const key = periodKey(target);
    if (key === currentKey.value) store.load(data, key);
}

const saveMutation = useMutation({
    mutationFn: (vars: { range: DateRange; shifts: Shift[] }) =>
        shiftsApi.sync(vars.range, vars.shifts),
    onSuccess: (data, vars) => putIntoCache(vars.range, data),
});

const publishMutation = useMutation({
    mutationFn: (target: DateRange) => shiftsApi.publish(target),
    onSuccess: (data, target) => putIntoCache(target, data),
});

const busy = computed(
    () => saveMutation.isPending.value || publishMutation.isPending.value,
);

async function save({ silent = false } = {}): Promise<boolean> {
    if (busy.value || gridLoading.value) return false;
    if (!store.isDirty) return true;

    const { from, to } = range.value;
    try {
        await saveMutation.mutateAsync({
            range: { from, to },
            shifts: store.list(),
        });
        if (!silent) toast.success('График сохранён');
        return true;
    } catch (error) {
        toast.error(apiErrorMessage(error));
        return false;
    }
}

// «Опубликовать» с несохранёнными правками сначала сохраняет их
async function publish() {
    if (busy.value || gridLoading.value) return;
    if (!(await save({ silent: true }))) return;

    const { from, to } = range.value;
    try {
        await publishMutation.mutateAsync({ from, to });
        toast.success('График опубликован');
    } catch (error) {
        toast.error(apiErrorMessage(error));
    }
}

const status = computed(() => {
    if (!records.value.length) return null;
    return records.value.every((r) => r.status === 'published')
        ? 'published'
        : 'draft';
});

const canPublish = computed(() => store.isDirty || status.value === 'draft');

// --- хоткеи и защита от потери черновика ---

const isTyping = (event: KeyboardEvent) =>
    event.target instanceof HTMLElement &&
    (event.target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));

// event.code, а не key: в русской раскладке Ctrl+Z приходит как «я»
onKeyStroke((event) => {
    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.code === 'KeyS') {
        event.preventDefault();
        void save();
        return;
    }
    if (isTyping(event)) return;

    if (mod && event.code === 'KeyZ') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
    } else if (mod && event.code === 'KeyY') {
        event.preventDefault();
        store.redo();
    } else if (mod || event.altKey) {
        return;
    } else if (event.key === 'Escape') {
        selection.reset();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!selection.selected.value.size) return;
        event.preventDefault();
        clearSelected();
    } else if (/^(Digit|Numpad)[1-9]$/.test(event.code)) {
        const template = templates.value[Number(event.code.slice(-1)) - 1];
        if (template) assignTemplate(template);
    }
});

useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
    if (!store.isDirty) return;
    event.preventDefault();
    event.returnValue = '';
});

onBeforeRouteLeave(() => confirmDiscard());
</script>

<template>
    <div class="flex flex-col gap-y-6">
        <UiBackLink to="/">Графики смен</UiBackLink>

        <div class="flex h-12 flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <h1 class="text-title-2xl">График</h1>
                <UiBadge v-if="status === 'published'">Опубликован</UiBadge>
                <UiBadge v-else-if="status === 'draft'" color="neutral"
                    >Черновик</UiBadge
                >
            </div>
            <div class="flex flex-row items-center gap-x-1">
                <span
                    v-if="store.isDirty"
                    class="mr-3 text-caption-s text-text-secondary"
                    >Есть несохранённые изменения</span
                >
                <UiButton
                    color="neutral"
                    kind="quaternary"
                    class="w-12 px-0"
                    aria-label="Отменить (Ctrl+Z)"
                    title="Отменить (Ctrl+Z)"
                    :disabled="!store.canUndo"
                    @click="store.undo()"
                >
                    <Undo2 :stroke-width="1.3" />
                </UiButton>
                <UiButton
                    color="neutral"
                    kind="quaternary"
                    class="mr-2 w-12 px-0"
                    aria-label="Повторить (Ctrl+Shift+Z)"
                    title="Повторить (Ctrl+Shift+Z)"
                    :disabled="!store.canRedo"
                    @click="store.redo()"
                >
                    <Redo2 :stroke-width="1.3" />
                </UiButton>
                <UiButton
                    color="brand"
                    size="md"
                    kind="secondary"
                    :disabled="!canPublish || gridLoading"
                    :loading="publishMutation.isPending.value"
                    @click="publish"
                    >Опубликовать</UiButton
                >
                <UiButton
                    color="brand"
                    size="md"
                    kind="primary"
                    title="Сохранить (Ctrl+S)"
                    :disabled="!store.isDirty || gridLoading"
                    :loading="saveMutation.isPending.value"
                    @click="save()"
                    >{{
                        saveMutation.isPending.value
                            ? 'Сохраняем…'
                            : 'Сохранить'
                    }}</UiButton
                >
            </div>
        </div>

        <div
            v-if="loadError"
            role="alert"
            class="flex items-center justify-between gap-4 rounded-m bg-fills-danger-primary px-4 py-3 text-caption-s text-danger"
        >
            <span
                >Не удалось загрузить график:
                {{ apiErrorMessage(loadError) }}</span
            >
            <UiButton color="neutral" kind="quinary" size="sm" @click="retry"
                >Повторить</UiButton
            >
        </div>

        <div class="flex flex-row gap-x-2">
            <ScheduleGrid
                class="flex-1"
                :employees="visibleEmployees"
                :days="range.days"
                :period="period"
                :shifts="store.shifts"
                :templates="templates"
                :selected="selection.selected.value"
                :coverage="store.coverage"
                :minutes-by-employee="store.minutesByEmployee"
                :loading="gridLoading"
                :selecting="selection.dragging.value"
                @cell-pointerdown="selection.pointerDown"
                @cell-pointerenter="selection.pointerEnter"
                @cell-toggle="selection.toggle"
                @quick-assign="quickAssign"
                @drop="onDrop"
            >
                <template #header>
                    <SelectionBar
                        v-if="selection.selected.value.size"
                        :cells="selection.summary.value.cells"
                        :employees="selection.summary.value.employees"
                        :days="selection.summary.value.days"
                        @clear="clearSelected"
                        @deselect="selection.reset"
                    />

                    <!-- без переноса строк: при узком окне сжимается поиск, высота шапки не меняется -->
                    <div v-else class="flex h-full items-center gap-2">
                        <EmployeeSearch
                            v-model="search"
                            class="max-w-99.5 min-w-40 flex-1"
                        />

                        <UiTabs
                            v-model="periodModel"
                            :items="schedulePeriods"
                            variant="contrast"
                            stretch
                            class="w-60 shrink-0"
                        />

                        <PeriodNavigation
                            class="shrink-0"
                            :label="periodLabel(range, period)"
                            :is-current="isCurrentPeriod"
                            @prev="goTo(shiftAnchor(anchor, period, -1))"
                            @next="goTo(shiftAnchor(anchor, period, 1))"
                            @today="goTo(todayISO())"
                        />
                    </div>
                </template>

                <template #empty>
                    <template v-if="search.trim()"
                        >Никого не нашли по запросу «{{
                            search.trim()
                        }}»</template
                    >
                    <template v-else>Сотрудников пока нет</template>
                </template>
            </ScheduleGrid>

            <ShiftPanel
                class="w-85 shrink-0"
                :templates="templates"
                :selected-count="selection.selected.value.size"
                :loading="templatesQuery.isPending.value"
                @select-template="assignTemplate"
                @apply-custom="assignCustom"
            />
        </div>
    </div>
</template>
