<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw }>()
</script>

<template>
  <RouterLink :to="to" class="flex h-10 w-fit items-center gap-x-3">
    <span class="grid size-10 place-items-center rounded-full bg-backgrounds-primary">
      <ChevronLeft class="size-6" :stroke-width="1.3" />
    </span>
    <span class="text-m leading-[140%]"><slot /></span>
  </RouterLink>
</template>
