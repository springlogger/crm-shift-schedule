<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import type { ShiftTime } from '@/entities/shift';
import { isValidTime, maskTime } from '@/shared/lib/time';
import { UiButton, UiInput } from '@/shared/ui';

defineProps<{ disabled?: boolean }>();

const emit = defineEmits<{ apply: [shift: ShiftTime] }>();

const start = ref('');
const end = ref('');

const isValid = computed(
    () =>
        isValidTime(start.value) &&
        isValidTime(end.value) &&
        start.value !== end.value,
);

function apply() {
    if (!isValid.value) return;

    emit('apply', { start: start.value, end: end.value });
}
</script>

<template>
    <form class="flex flex-col gap-2" @submit.prevent="apply">
        <p>Своя смена</p>

        <div class="flex gap-2">
            <UiInput
                v-model="start"
                label="Начало"
                placeholder="00:00"
                inputmode="numeric"
                autocomplete="off"
                :format="maskTime"
                class="flex-1"
            />
            <UiInput
                v-model="end"
                label="Конец"
                placeholder="00:00"
                inputmode="numeric"
                autocomplete="off"
                :format="maskTime"
                class="flex-1"
            />
        </div>

        <UiButton
            type="submit"
            color="brand"
            kind="secondary"
            :disabled="!isValid || disabled"
            class="w-full"
        >
            <template #iconLeft>
                <Plus :stroke-width="1.3" />
            </template>
            Поставить в выделенное
        </UiButton>
    </form>
</template>
