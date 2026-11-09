<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';
import type { ShiftTemplate } from '@/entities/shift-template';
import { cn } from '@/shared/lib/cn';

defineProps<{
    weekday: string;
    day: number;
    isToday?: boolean;
    templates: ShiftTemplate[];
}>();

const emit = defineEmits<{ assign: [template: ShiftTemplate] }>();

const open = ref(false);
const root = useTemplateRef('root');

// корень включает и кнопку, иначе клик по ней сначала закрыл бы меню «снаружи», а потом открыл снова
onClickOutside(root, () => (open.value = false));
onKeyStroke('Escape', () => (open.value = false));

function choose(template: ShiftTemplate) {
    emit('assign', template);
    open.value = false;
}
</script>

<template>
    <div ref="root" class="relative">
        <button
            type="button"
            :class="
                cn(
                    'cursor-pointer rounded-xs px-1 hover:bg-backgrounds-secondary hover:text-text-primary',
                    isToday && 'font-semibold text-brand-5',
                )
            "
            :aria-expanded="open"
            aria-haspopup="menu"
            :aria-label="`${weekday} ${day}: назначить смену всем свободным`"
            :aria-current="isToday ? 'date' : undefined"
            @click="open = !open"
        >
            {{ weekday }} {{ day }}
        </button>
        <div
            v-if="open"
            role="menu"
            class="absolute top-9 left-1/2 z-30 w-44 -translate-x-1/2 rounded-m border border-border-neutral-subtle bg-backgrounds-primary p-1 shadow-lg"
        >
            <p class="px-2 py-1 text-caption-s text-text-secondary">
                Назначить всем свободным
            </p>
            <p
                v-if="!templates.length"
                class="px-2 py-1 text-caption-xs text-text-secondary"
            >
                Шаблонов пока нет
            </p>
            <button
                v-for="template in templates"
                :key="template.id"
                type="button"
                role="menuitem"
                class="flex w-full cursor-pointer flex-col rounded-xs px-2 py-1 text-left hover:bg-backgrounds-secondary"
                @click="choose(template)"
            >
                <span class="text-m text-text-primary">{{
                    template.name
                }}</span>
                <span class="text-caption-xs text-text-secondary"
                    >{{ template.start }}–{{ template.end }}</span
                >
            </button>
        </div>
    </div>
</template>
