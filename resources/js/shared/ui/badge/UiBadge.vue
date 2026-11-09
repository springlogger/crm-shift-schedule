<script setup lang="ts">
import { cn } from '@/shared/lib/cn'

withDefaults(defineProps<{ color?: 'blue' | 'neutral' }>(), { color: 'blue' })
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center justify-center gap-1 rounded-full px-2 pt-1 pb-1.5 text-caption-xs font-semibold text-white',
        color === 'blue' ? 'bg-info' : 'bg-button-neutral-primary-bg-default',
      )
    "
  >
    <slot />
  </span>
</template>
