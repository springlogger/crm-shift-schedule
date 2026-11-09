<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ShiftColor;
use Database\Factories\ShiftTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $name
 * @property string $start_time
 * @property string $end_time
 * @property ShiftColor $color
 * @property int $sort
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'start_time', 'end_time', 'color', 'sort'])]
class ShiftTemplate extends Model
{
    /** @use HasFactory<ShiftTemplateFactory> */
    use HasFactory;

    public const string CACHE_KEY = 'shift_templates.all';

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * @return Collection<int, self>
     */
    public static function cachedList(): Collection
    {
        // в кэше только сырые строки: Laravel не восстанавливает из кэша объекты
        // (cache.serializable_classes = false), поэтому модели собираем через hydrate
        /** @var list<array<string, mixed>> $rows */
        $rows = Cache::rememberForever(
            self::CACHE_KEY,
            fn () => self::query()->orderBy('sort')->orderBy('id')->toBase()->get()
                ->map(fn (object $row) => (array) $row)->all(),
        );

        return self::hydrate($rows);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'color' => ShiftColor::class,
        ];
    }
}
