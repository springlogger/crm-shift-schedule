<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ShiftStatus;
use App\Models\Shift;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * @phpstan-import-type ShiftPayload from Shift
 */
final class ShiftSyncService
{
    /**
     * Приводит смены периода к присланному списку:
     * - в БД есть, в запросе нет — удаляем;
     * - в запросе есть, в БД нет — вставляем черновиком;
     * - есть и там, и там, но отличается — обновляем и сбрасываем в черновик;
     * - совпадает — не трогаем, статус «опубликовано» сохраняется.
     *
     * Всё в одной транзакции, чтобы при сбое не остался половинчатый график.
     *
     * @param  list<ShiftPayload>  $items
     * @return Collection<int, Shift>
     */
    public function sync(CarbonImmutable $from, CarbonImmutable $to, array $items): Collection
    {
        $range = [$from->toDateString(), $to->toDateString()];

        return DB::transaction(function () use ($range, $items) {
            $existing = Shift::query()->betweenDates(...$range)->get()
                ->keyBy(fn (Shift $s) => $s->cellKey());

            $incoming = collect($items)
                ->keyBy(fn (array $s) => Shift::makeCellKey($s['employee_id'], $s['date']));

            $removed = $existing->diffKeys($incoming);
            if ($removed->isNotEmpty()) {
                Shift::query()->whereKey($removed->modelKeys())->delete();
            }

            $changed = $incoming
                ->reject(fn (array $s, string $key) => $existing->get($key)?->sameAs($s) ?? false)
                ->map(fn (array $s) => [
                    'employee_id' => $s['employee_id'],
                    'date' => $s['date'],
                    'start_time' => $s['start'],
                    'end_time' => $s['end'],
                    'shift_template_id' => $s['template_id'] ?? null,
                    'status' => ShiftStatus::Draft->value,
                ])
                ->values()
                ->all();

            if ($changed !== []) {
                // upsert опирается на UNIQUE(employee_id, date) из миграции
                Shift::query()->upsert(
                    $changed,
                    ['employee_id', 'date'],
                    ['start_time', 'end_time', 'shift_template_id', 'status'],
                );
            }

            return $this->forPeriod(...$range);
        });
    }

    /**
     * @return Collection<int, Shift>
     */
    public function publish(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $range = [$from->toDateString(), $to->toDateString()];

        Shift::query()
            ->betweenDates(...$range)
            ->where('status', ShiftStatus::Draft)
            ->update(['status' => ShiftStatus::Published, 'updated_at' => now()]);

        return $this->forPeriod(...$range);
    }

    /**
     * @return Collection<int, Shift>
     */
    public function forPeriod(string $from, string $to): Collection
    {
        return Shift::query()
            ->betweenDates($from, $to)
            ->orderBy('date')
            ->orderBy('employee_id')
            ->get();
    }
}
