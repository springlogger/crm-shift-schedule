<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/shared/api';

const appName = ref<string | null>(null);

onMounted(async () => {
    const meta = await api<{ name: string }>('/meta');
    appName.value = meta.name;
});
</script>

<template>
    <div class="flex h-full flex-col items-center justify-center gap-2">
        <h1 class="text-title-2xl">График смен</h1>
        <p v-if="appName" class="text-m text-text-secondary">
            Данные из API: {{ appName }}
        </p>
    </div>
</template>
