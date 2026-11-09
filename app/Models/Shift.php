<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ShiftStatus;
use Database\Factories\ShiftFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Дата хранится и отдаётся строкой Y-m-d без каста в Carbon: с кастом Eloquent
 * записал бы в SQLite «Y-m-d H:i:s», и строковое сравнение в whereBetween
 * теряло бы последний день периода.
 *
 * @property int $id
 * @property int $employee_id
 * @property int|null $shift_template_id
 * @property string $date
 * @property string $start_time
 * @property string $end_time
 * @property ShiftStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @phpstan-type ShiftPayload array{employee_id: int, date: string, start: string, end: string, template_id?: int|null}
 */
#[Fillable(['employee_id', 'shift_template_id', 'date', 'start_time', 'end_time', 'status'])]
class Shift extends Model
{
    /** @use HasFactory<ShiftFactory> */
    use HasFactory;

    /**
     * @param  Builder<self>  $query
     */
    public function scopeBetweenDates(Builder $query, string $from, string $to): void
    {
        $query->whereBetween('date', [$from, $to]);
    }

    public function cellKey(): string
    {
        return self::makeCellKey($this->employee_id, $this->date);
    }

    public static function makeCellKey(int $employeeId, string $date): string
    {
        return $employeeId.'|'.$date;
    }

    /**
     * @param  ShiftPayload  $payload
     */
    public function sameAs(array $payload): bool
    {
        // TIME из MySQL/PostgreSQL приходит как «07:00:00», с фронта — «07:00»
        return substr($this->start_time, 0, 5) === $payload['start']
            && substr($this->end_time, 0, 5) === $payload['end']
            && $this->shift_template_id === ($payload['template_id'] ?? null);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<ShiftTemplate, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(ShiftTemplate::class, 'shift_template_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'employee_id' => 'integer',
            'shift_template_id' => 'integer',
            'status' => ShiftStatus::class,
        ];
    }
}
