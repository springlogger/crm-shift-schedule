const MINUTES_IN_DAY = 24 * 60;

// пользователь вводит только цифры, двоеточие ставим сами: "0730" → "07:30"
export function maskTime(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);

    return digits.length > 2
        ? `${digits.slice(0, 2)}:${digits.slice(2)}`
        : digits;
}

export function isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
}

// конец не позже начала — смена переходит через полночь: 22:00–06:00 это 8 ч, а не −16
export function durationMinutes(start: string, end: string): number {
    const diff = toMinutes(end) - toMinutes(start);

    return diff > 0 ? diff : diff + MINUTES_IN_DAY;
}

const hoursFormat = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
});

export function formatHours(minutes: number): string {
    return `${hoursFormat.format(minutes / 60)} ч`;
}
