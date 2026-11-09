<script setup lang="ts">
import { UiSearchInput } from '@/shared/ui'

const model = defineModel<string>({ default: '' })
</script>

<template>
  <UiSearchInput v-model="model" placeholder="Поиск по ФИО" />
</template>
