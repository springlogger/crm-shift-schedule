// @vitest-environment happy-dom
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createMemoryHistory, createRouter } from 'vue-router';
import SchedulePage from './SchedulePage.vue';

const employees = [
    {
        id: 1,
        name: 'Алина',
        surname: 'Кузнецова',
        position: 'агент',
        hours: 24,
        avatarUrl: null,
    },
    {
        id: 2,
        name: 'Тимур',
        surname: 'Волков',
        position: 'агент',
        hours: 24,
        avatarUrl: null,
    },
];
const templates = [
    { id: 7, name: 'Утро', start: '07:00', end: '15:00', color: 'lavanda' },
];
const saved = [
    {
        employeeId: 1,
        date: '2026-11-02',
        start: '07:00',
        end: '15:00',
        templateId: 7,
        status: 'published',
    },
];

type SyncBody = {
    from: string;
    to: string;
    shifts: {
        employee_id: number;
        date: string;
        start: string;
        end: string;
        template_id: number | null;
    }[];
};

function mockApi() {
    const json = (data: unknown) =>
        new Response(JSON.stringify({ data }), { status: 200 });

    return vi.fn(async (input: string, init?: RequestInit) => {
        const url = new URL(input, 'http://localhost');
        if (url.pathname === '/api/employees') return json(employees);
        if (url.pathname === '/api/shift-templates') return json(templates);
        if (url.pathname === '/api/shifts') {
            return json(
                url.searchParams.get('from') === '2026-11-02' ? saved : [],
            );
        }
        if (url.pathname === '/api/shifts/sync' && init?.method === 'PUT') {
            const body = JSON.parse(init.body as string) as SyncBody;
            return json(
                body.shifts.map((s) => ({
                    employeeId: s.employee_id,
                    date: s.date,
                    start: s.start,
                    end: s.end,
                    templateId: s.template_id,
                    status: 'draft',
                })),
            );
        }
        return new Response('{}', { status: 404 });
    });
}

async function mountPage() {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: { template: '<div />' } },
            { path: '/schedule', component: SchedulePage },
        ],
    });
    await router.push('/schedule?view=week&date=2026-11-04');

    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const wrapper = mount(SchedulePage, {
        attachTo: document.body,
        global: {
            plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }]],
        },
    });
    await vi.waitFor(() => expect(wrapper.text()).toContain('Кузнецова Алина'));
    await flushPromises();

    return wrapper;
}

describe('SchedulePage', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.innerHTML = '';
    });

    it('загружает график, назначает шаблон в выделенную ячейку и сохраняет', async () => {
        const fetchMock = mockApi();
        vi.stubGlobal('fetch', fetchMock);
        const wrapper = await mountPage();

        expect(wrapper.text()).toContain('2 – 8 ноября 2026');
        expect(wrapper.text()).toContain('Опубликован');
        expect(
            wrapper.findAll('[draggable="true"][title^="Утро"]'),
        ).toHaveLength(1);

        await wrapper
            .get('[aria-label="Волков Тимур, вт 3"]')
            .trigger('pointerdown', { button: 0 });
        window.dispatchEvent(new Event('pointerup'));
        expect(wrapper.text()).toContain('Выделено:');

        await wrapper.get('[aria-label^="Шаблон Утро"]').trigger('click');
        expect(
            wrapper.findAll('[draggable="true"][title^="Утро"]'),
        ).toHaveLength(2);
        expect(wrapper.text()).toContain('Есть несохранённые изменения');

        const saveButton = wrapper
            .findAll('button')
            .find((b) => b.text() === 'Сохранить');
        await saveButton!.trigger('click');
        await flushPromises();

        const syncCall = fetchMock.mock.calls.find(
            ([url]) => url === '/api/shifts/sync',
        );
        const body = JSON.parse(syncCall?.[1]?.body as string) as SyncBody;
        expect(body.from).toBe('2026-11-02');
        expect(body.to).toBe('2026-11-08');
        expect(body.shifts).toContainEqual({
            employee_id: 2,
            date: '2026-11-03',
            start: '07:00',
            end: '15:00',
            template_id: 7,
        });
        expect(wrapper.text()).not.toContain('Есть несохранённые изменения');
        expect(wrapper.text()).toContain('Черновик');
    });

    it('показывает пустое состояние поиска', async () => {
        vi.stubGlobal('fetch', mockApi());
        const wrapper = await mountPage();

        await wrapper.get('input[type="search"]').setValue('несуществующий');

        expect(wrapper.text()).toContain(
            'Никого не нашли по запросу «несуществующий»',
        );
    });
});
