<script setup lang="ts">
import { computed, useSlots, type HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/cn'
import { buttonVariants, type ButtonVariants } from './variants'

const props = withDefaults(
  defineProps<{
    color?: ButtonVariants['color']
    kind?: ButtonVariants['kind']
    size?: ButtonVariants['size']
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    class?: HTMLAttributes['class']
  }>(),
  { type: 'button' },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const slots = useSlots()

const classes = computed(() =>
  cn(
    buttonVariants({ color: props.color, kind: props.kind, size: props.size }),
    slots.iconLeft && 'pl-3',
    slots.iconRight && 'pr-3',
    props.class,
  ),
)
</script>

<template>
  <button
    class="cursor-pointer"
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="emit('click', $event)"
  >
    <slot name="iconLeft" />
    <slot />
    <slot name="iconRight" />
  </button>
</template>
