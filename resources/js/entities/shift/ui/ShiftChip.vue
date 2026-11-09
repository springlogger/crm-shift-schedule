<script setup lang="ts">
import { cn } from '@/shared/lib/cn'
import { shiftColorClasses, type ShiftColor } from '../model/colors'

defineProps<{ color: ShiftColor; time: string; hours: string; compact?: boolean }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex size-full flex-col items-center justify-center rounded-m p-1 text-text-primary tabular',
        shiftColorClasses[color].chip,
      )
    "
  >
    <span v-if="compact" :class="cn('text-m font-semibold', shiftColorClasses[color].hours)">{{ hours }}</span>
    <template v-else>
      <span class="text-m">{{ time }}</span>
      <span :class="cn('text-caption-xs', shiftColorClasses[color].hours)">{{ hours }}</span>
    </template>
  </div>
</template>
