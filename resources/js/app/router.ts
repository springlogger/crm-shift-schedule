import { createRouter, createWebHistory } from 'vue-router';
import { HomePage } from '@/pages/home';
import { SchedulePage } from '@/pages/schedule';
import { AppLayout } from '@/widgets/app-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                { path: '', component: HomePage },
                { path: 'schedule', component: SchedulePage },
            ],
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () =>
                import('@/pages/not-found').then((m) => m.NotFoundPage),
            meta: { title: 'Страница не найдена' },
        },
    ],
});

router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} - ${appName}` : appName;
});
