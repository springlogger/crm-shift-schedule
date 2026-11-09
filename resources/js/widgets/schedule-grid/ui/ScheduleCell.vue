<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { cn } from '@/shared/lib/cn';

defineProps<{ selected?: boolean; dropTarget?: boolean; filled?: boolean }>();
</script>

<template>
    <div
        :class="
            cn(
                'flex h-18 min-w-0 p-1',
                (selected || dropTarget) &&
                    'bg-fills-brand-primary ring-1 ring-border-brand-strong ring-inset',
                'cursor-pointer',
            )
        "
    >
        <div
            :class="
                cn(
                    'grid flex-1 place-items-center rounded-m',
                    !filled &&
                        !selected &&
                        !dropTarget &&
                        'border border-dashed border-border-neutral-subtle',
                    !filled &&
                        !selected &&
                        !dropTarget &&
                        'hover:border-border-brand-strong',
                )
            "
        >
            <slot v-if="filled" />
            <span
                v-else-if="selected"
                class="grid size-5 place-items-center rounded-full bg-brand-5 text-white"
            >
                <Plus class="size-3" :stroke-width="2.2" />
            </span>
        </div>
    </div>
</template>
