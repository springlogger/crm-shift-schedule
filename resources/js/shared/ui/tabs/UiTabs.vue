<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/cn'

const model = defineModel<T>({ required: true })

const props = withDefaults(
  defineProps<{
    items: { value: T; label: string }[]
    variant?: 'segmented' | 'contrast' | 'pills'
    stretch?: boolean
    class?: HTMLAttributes['class']
  }>(),
  { variant: 'segmented' },
)
</script>

<template>
  <div
    role="radiogroup"
    :class="
      cn(
        'inline-flex',
        variant === 'segmented' && 'rounded-xl bg-backgrounds-tertiary p-0.5',
        variant === 'contrast' && 'rounded-xl bg-backgrounds-quaternary p-0.5',
        variant === 'pills' && 'gap-2',
        stretch && 'flex w-full',
        props.class,
      )
    "
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="radio"
      :aria-checked="model === item.value"
      :class="
        cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-tab px-6 text-m font-semibold text-text-primary transition-colors',
          stretch && 'flex-1',
          variant === 'segmented' &&
            (model === item.value ? 'h-12 bg-backgrounds-primary' : 'h-12 hover:bg-backgrounds-secondary'),
          variant === 'contrast' &&
            (model === item.value
              ? 'h-11 bg-backgrounds-neutral-primary-hover text-white'
              : 'h-11 hover:bg-button-neutral-secondary-bg-hover'),
          variant === 'pills' &&
            (model === item.value
              ? 'h-10 bg-backgrounds-neutral-primary-hover text-white'
              : 'h-10 bg-backgrounds-quaternary hover:bg-backgrounds-tertiary'),
        )
      "
      @click="model = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>
