<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $last_name
 * @property string $first_name
 * @property string $position
 * @property int $weekly_hours
 * @property string|null $avatar_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['last_name', 'first_name', 'position', 'weekly_hours', 'avatar_url'])]
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use HasFactory;

    public const string CACHE_KEY = 'employees.all';

    protected static function booted(): void
    {
        // список читается на каждой загрузке графика, а меняется редко — кэшируем целиком
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
            fn () => self::query()->orderBy('last_name')->orderBy('first_name')->toBase()->get()
                ->map(fn (object $row) => (array) $row)->all(),
        );

        return self::hydrate($rows);
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $words = preg_split('/\s+/u', trim($term), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        // каждое слово запроса должно найтись в фамилии или имени: «алин кузн» находит «Кузнецова Алина»
        foreach ($words as $word) {
            $like = '%'.addcslashes($word, '%_\\').'%';
            $query->where(fn (Builder $q) => $q
                ->where('last_name', 'like', $like)
                ->orWhere('first_name', 'like', $like));
        }
    }

    /**
     * @return HasMany<Shift, $this>
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }
}
