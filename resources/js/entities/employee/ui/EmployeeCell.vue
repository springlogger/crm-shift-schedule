<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/lib/cn'
import { UiAvatar } from '@/shared/ui'
import type { Employee } from '../model/types'

// hours — норма за показанный период; assignedHours — сколько уже назначено
const props = defineProps<Omit<Employee, 'id'> & { assignedHours?: number }>()

const hoursFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })

const overtime = computed(() => props.assignedHours !== undefined && props.assignedHours > props.hours)
</script>

<template>
  <div class="flex items-center gap-2 py-3 pr-3 pl-2">
    <UiAvatar :name="`${surname} ${name}`" :src="avatarUrl" />
    <div class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-m text-black">{{ surname }} {{ name }}</span>
      <span class="flex gap-1 text-caption-xs text-text-secondary">
        <span>{{ position }}</span>
        <span>·</span>
        <span
          :class="cn('tabular', overtime && 'text-danger')"
          :title="assignedHours !== undefined ? 'Назначено / норма за период' : undefined"
        >
          <template v-if="assignedHours !== undefined">{{ hoursFormat.format(assignedHours) }} / </template>{{ hours }} ч
        </span>
      </span>
    </div>
  </div>
</template>
