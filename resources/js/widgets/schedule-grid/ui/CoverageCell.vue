<script setup lang="ts">
import { cn } from '@/shared/lib/cn'

defineProps<{ count: number }>()
</script>

<template>
  <div class="flex min-h-full min-w-0 border-y border-border-neutral-subtle">
    <div
      :class="
        cn(
          'flex flex-1 items-center justify-center tabular',
          count ? 'bg-fills-info-primary text-info' : 'bg-fills-danger-primary text-danger',
        )
      "
      :title="count ? `На смене: ${count}` : 'В этот день никого нет'"
    >
      {{ count }}
    </div>
  </div>
</template>
