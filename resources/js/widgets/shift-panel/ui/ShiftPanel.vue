<script setup lang="ts">
import type { ShiftTime } from '@/entities/shift';
import { TemplateCard, type ShiftTemplate } from '@/entities/shift-template';
import { CustomShiftForm } from '@/features/custom-shift';
import { startDrag } from '@/features/shift-dnd';
import { durationMinutes, formatHours } from '@/shared/lib/time';
import { UiKbd } from '@/shared/ui';

const props = defineProps<{
    templates: ShiftTemplate[];
    selectedCount: number;
    loading?: boolean;
}>();

const emit = defineEmits<{
    selectTemplate: [template: ShiftTemplate];
    applyCustom: [shift: ShiftTime];
}>();

// цифры 1–9 назначают шаблон в выделенное (обработчик — на странице)
const hotkey = (index: number) => (index < 9 ? index + 1 : undefined);
</script>

<template>
    <aside class="flex flex-col gap-y-6 rounded-2xl bg-backgrounds-primary p-4">
        <section class="flex flex-col gap-y-1">
            <p class="mb-1">Шаблоны смен</p>
            <p
                v-if="!props.selectedCount"
                class="mb-2 text-caption-s text-text-secondary"
            >
                Выберите ячейки в графике, чтобы назначить или изменить смену.
                Шаблон можно и перетащить на ячейку.
            </p>
            <p class="mb-2 text-caption-s text-text-secondary">
                <UiKbd>Ctrl</UiKbd> + клик — выбрать несколько ячеек,
                <UiKbd>Shift</UiKbd> + клик — диапазон. Можно и протянуть мышью.
            </p>

            <template v-if="loading">
                <div
                    v-for="i in 3"
                    :key="i"
                    class="h-16 animate-pulse rounded-m bg-backgrounds-quaternary"
                />
            </template>
            <p
                v-else-if="!templates.length"
                class="text-caption-s text-text-secondary"
            >
                Шаблонов пока нет.
            </p>

            <!-- не <button>: Firefox не даёт перетаскивать кнопки -->
            <div
                v-for="(template, index) in templates"
                :key="template.id"
                role="button"
                tabindex="0"
                draggable="true"
                :aria-disabled="!props.selectedCount || undefined"
                :aria-label="`Шаблон ${template.name}, ${template.start}–${template.end}`"
                class="w-full cursor-grab rounded-m text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand-strong active:cursor-grabbing aria-disabled:opacity-70"
                @click="emit('selectTemplate', template)"
                @keydown.enter.prevent="emit('selectTemplate', template)"
                @keydown.space.prevent="emit('selectTemplate', template)"
                @dragstart="
                    startDrag($event, {
                        kind: 'template',
                        templateId: template.id,
                    })
                "
            >
                <TemplateCard
                    :name="template.name"
                    :start="template.start"
                    :end="template.end"
                    :hours="
                        formatHours(
                            durationMinutes(template.start, template.end),
                        )
                    "
                    :color="template.color"
                    :hotkey="hotkey(index)"
                />
            </div>
        </section>

        <CustomShiftForm
            :disabled="!props.selectedCount"
            @apply="emit('applyCustom', $event)"
        />
    </aside>
</template>
