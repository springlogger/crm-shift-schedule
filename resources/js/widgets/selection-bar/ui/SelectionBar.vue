<script setup lang="ts">
import { computed } from 'vue';
import { Trash2, X } from 'lucide-vue-next';
import { plural } from '@/shared/lib/plural';

const props = defineProps<{ cells: number; employees: number; days: number }>();

defineEmits<{ clear: []; deselect: [] }>();

const cellsLabel = computed(
    () =>
        `${props.cells} ${plural(props.cells, ['ячейка', 'ячейки', 'ячеек'])}`,
);
const employeesLabel = computed(
    () =>
        `${props.employees} ${plural(props.employees, ['сотрудник', 'сотрудника', 'сотрудников'])}`,
);

const action =
    'inline-flex h-9 items-center gap-1 rounded-m p-2 transition-colors hover:bg-white/10 active:bg-white/20 [&_svg]:size-4';
</script>

<template>
    <div
        class="flex h-13 items-center justify-between gap-2.5 rounded-m bg-backgrounds-neutral-primary-hover px-3 py-2 text-caption-s text-white"
    >
        <div class="flex min-w-0 items-center gap-2.5">
            <span>Выделено:</span>
            <span
                class="rounded-full bg-button-neutral-primary-bg-active px-2 py-0.5"
                >{{ cellsLabel }}</span
            >
            <span>{{ employeesLabel }} · {{ days }} дн.</span>
            <span v-if="cells === 1" class="truncate text-white/60"
                >Ctrl + клик — добавить ещё</span
            >
        </div>
        <div class="flex shrink-0 items-center gap-2">
            <button type="button" :class="action" @click="$emit('clear')">
                <Trash2 :stroke-width="1.3" />
                Очистить смены
            </button>
            <button type="button" :class="action" @click="$emit('deselect')">
                <X :stroke-width="1.3" />
                Снять выделение
            </button>
        </div>
    </div>
</template>
