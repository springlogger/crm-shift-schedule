<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { UiButton } from '@/shared/ui';

defineProps<{ label: string; isCurrent?: boolean }>();

defineEmits<{ prev: []; next: []; today: [] }>();

const arrow =
    'grid size-11 cursor-pointer place-items-center rounded-tab text-text-primary transition-colors hover:bg-button-neutral-secondary-bg-hover active:bg-button-neutral-secondary-bg-active';
</script>

<template>
    <div class="flex items-center gap-2">
        <div
            class="flex items-center rounded-xl bg-backgrounds-quaternary p-0.5"
        >
            <button
                type="button"
                :class="arrow"
                aria-label="Предыдущий период"
                @click="$emit('prev')"
            >
                <ChevronLeft class="size-5" :stroke-width="1.5" />
            </button>
            <span
                class="min-w-44 px-2 text-center text-m font-semibold whitespace-nowrap tabular"
                aria-live="polite"
                >{{ label }}</span
            >
            <button
                type="button"
                :class="arrow"
                aria-label="Следующий период"
                @click="$emit('next')"
            >
                <ChevronRight class="size-5" :stroke-width="1.5" />
            </button>
        </div>
        <UiButton
            color="neutral"
            kind="quaternary"
            :disabled="isCurrent"
            @click="$emit('today')"
            >Сегодня</UiButton
        >
    </div>
</template>
