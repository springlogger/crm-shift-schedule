<script setup lang="ts">
import { useId, type HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/cn'

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })

const props = defineProps<{
  label?: string
  hint?: string
  format?: (value: string) => string
  class?: HTMLAttributes['class']
}>()

const id = useId()

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = props.format ? props.format(input.value) : input.value

  // если format отбросил символ, значение модели не меняется и Vue не перерисует поле — правим руками
  input.value = value
  model.value = value
}
</script>

<template>
  <div :class="cn('flex min-w-0 flex-col gap-1', props.class)">
    <label v-if="label" :for="id" class="text-caption-xs leading-[140%] text-text-secondary">
      {{ label }}
    </label>
    <div
      class="flex h-12 items-center gap-2.5 rounded-m border border-transparent bg-backgrounds-quaternary py-2 pr-2 pl-4 transition-colors hover:border-border-neutral-strong focus-within:border-border-brand-strong"
    >
      <input
        :id="id"
        v-bind="$attrs"
        :value="model"
        class="min-w-0 flex-1 bg-transparent text-m text-text-primary outline-none placeholder:text-text-secondary"
        @input="onInput"
      />
      <slot name="icon" />
    </div>
    <p v-if="hint" class="text-caption-xs text-text-primary">{{ hint }}</p>
  </div>
</template>
