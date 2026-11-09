<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { cn } from '@/shared/lib/cn'

const model = defineModel<string>({ default: '' })

withDefaults(defineProps<{ tone?: 'gray' | 'white'; placeholder?: string }>(), {
  tone: 'gray',
  placeholder: 'Поиск',
})
</script>

<template>
  <label
    :class="
      cn(
        'flex h-12 items-center gap-2.5 rounded-xl border border-transparent px-3 transition-colors hover:border-border-neutral-strong focus-within:border-transparent',
        tone === 'gray' ? 'bg-backgrounds-quaternary' : 'bg-backgrounds-primary',
      )
    "
  >
    <span class="grid size-6 shrink-0 place-items-center text-icon-secondary">
      <Search class="size-4" :stroke-width="1.3" />
    </span>
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      class="min-w-0 flex-1 bg-transparent text-m text-text-primary outline-none placeholder:text-text-secondary [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="model"
      type="button"
      aria-label="Очистить поиск"
      class="grid size-6 shrink-0 place-items-center text-icon-tertiary"
      @click="model = ''"
    >
      <X class="size-4" :stroke-width="1.5" />
    </button>
  </label>
</template>
