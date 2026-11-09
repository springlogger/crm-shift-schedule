<script lang="ts" setup>
import { Bell, Calendar, House, LogOut } from 'lucide-vue-next'

const nav = [
  { to: '/', label: 'Главная', icon: House },
  { to: '/schedule', label: 'Смены', icon: Calendar },
]

const item = 'flex h-10 items-center gap-3 rounded-m p-2 text-m font-semibold text-text-primary'
</script>

<template>
  <div class="flex h-screen">
    <aside class="flex w-70 shrink-0 flex-col gap-6 border-r py-4 pr-4 pl-3.5">
      <div class="flex flex-1 flex-col gap-4">
        <div class="flex h-10 items-center justify-between">
          <span class="text-headline-l">CRM</span>
          <button
            type="button"
            aria-label="Уведомления"
            class="grid size-10 place-items-center rounded-m bg-backgrounds-quaternary"
          >
            <Bell class="size-6" :stroke-width="1.3" />
          </button>
        </div>

        <nav class="flex flex-col gap-0.5">
          <RouterLink
            v-for="link in nav"
            :key="link.to"
            :to="link.to"
            :class="item"
            class="aria-[current=page]:bg-backgrounds-primary"
          >
            <component :is="link.icon" class="size-6 shrink-0" :stroke-width="1.3" />
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>

      <button type="button" :class="item">
        <LogOut class="size-6 shrink-0" :stroke-width="1.3" />
        Выйти
      </button>
    </aside>

    <main class="min-w-0 flex-1 overflow-auto px-7.5 py-6">
      <RouterView />
    </main>
  </div>
</template>
