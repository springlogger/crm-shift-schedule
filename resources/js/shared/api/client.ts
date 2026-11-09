export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly data: unknown,
    ) {
        super(`API request failed with status ${status}`);
    }
}

// Laravel кладёт CSRF-токен в cookie XSRF-TOKEN при загрузке Blade-оболочки;
// Sanctum ждёт его обратно в заголовке X-XSRF-TOKEN на изменяющих запросах.
function xsrfToken(): string | undefined {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : undefined;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const token = xsrfToken();
    if (token) {
        headers.set('X-XSRF-TOKEN', token);
    }

    const response = await fetch(`/api${path}`, {
        ...init,
        headers,
        credentials: 'same-origin',
    });

    const data: unknown =
        response.status === 204
            ? null
            : await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(response.status, data);
    }

    return data as T;
}

// Laravel отдаёт ошибки как {message, errors?: {field: [..]}}; для тоста берём первую ошибку поля,
// она конкретнее общего message («... (and 2 more errors)»)
export function apiErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'Не удалось связаться с сервером. Проверьте подключение.';
    }

    const data = (error.data ?? {}) as {
        message?: unknown;
        errors?: Record<string, unknown>;
    };
    const firstFieldError = Object.values(data.errors ?? {})
        .flat()
        .find((m): m is string => typeof m === 'string');

    if (firstFieldError) return firstFieldError;
    if (error.status === 419) return 'Сессия устарела. Обновите страницу.';
    if (error.status >= 500) return 'Ошибка на сервере. Попробуйте ещё раз.';

    return typeof data.message === 'string' && data.message
        ? data.message
        : `Ошибка запроса (${error.status}).`;
}
