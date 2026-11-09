import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import '@fontsource-variable/manrope';
import 'vue-sonner/style.css';
import App from '@/app/App.vue';
import { focus } from '@/app/directives/focus';
import { router } from '@/app/router';

// Vue Query держит серверное состояние (кэш по ключу запроса),
// Pinia — черновик графика, который пользователь правит до «Сохранить»
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 60_000 },
        mutations: { retry: false },
    },
});

createApp(App)
    .directive('focus', focus)
    .use(createPinia())
    .use(VueQueryPlugin, { queryClient })
    .use(router)
    .mount('#app');
