<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ name: string; src?: string | null }>()

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join(''),
)
</script>

<template>
  <span
    class="relative inline-grid size-10 shrink-0 place-items-center overflow-hidden rounded-xs border-[0.5px] border-backgrounds-quaternary bg-backgrounds-tertiary"
  >
    <img v-if="src && !failed" :src="src" :alt="name" class="size-full object-cover" @error="failed = true" />
    <span
      v-else
      class="grid size-full place-items-center bg-info bg-linear-to-b from-white/50 to-white/0 text-m font-semibold text-white"
    >
      {{ initials }}
    </span>
  </span>
</template>
