<script setup lang="ts">
import { cn } from '@/shared/lib/cn'
import { UiKbd } from '@/shared/ui'
import { shiftColorClasses, type ShiftColor } from '@/entities/shift'

defineProps<{ name: string; start: string; end: string; hours: string; color: ShiftColor; hotkey?: string | number }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex h-16 items-start gap-2 rounded-m border-l-3 bg-backgrounds-quaternary py-2 pr-2 pl-4',
        shiftColorClasses[color].accent,
      )
    "
  >
    <div class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-m font-semibold text-black">{{ name }}</span>
      <span class="flex gap-1 text-m text-black tabular">
        <span>{{ start }} - {{ end }}</span>
        <span class="text-text-primary">·</span>
        <span>{{ hours }}</span>
      </span>
    </div>
    <UiKbd v-if="hotkey !== undefined">{{ hotkey }}</UiKbd>
  </div>
</template>
