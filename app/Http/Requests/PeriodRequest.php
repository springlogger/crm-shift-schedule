<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Период графика [from; to] включительно. Используется для чтения и публикации смен.
 */
class PeriodRequest extends FormRequest
{
    // месяц плюс запас: защищает от выборки «за всё время» одним запросом
    public const int MAX_DAYS = 62;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['from', 'to'])) {
                    return;
                }

                if ($this->from()->diffInDays($this->to()) >= self::MAX_DAYS) {
                    $validator->errors()->add('to', 'Период не может быть длиннее '.self::MAX_DAYS.' дней.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from.required' => 'Не указано начало периода.',
            'to.required' => 'Не указан конец периода.',
            '*.date_format' => 'Дата должна быть в формате ГГГГ-ММ-ДД.',
            'to.after_or_equal' => 'Конец периода раньше начала.',
        ];
    }

    public function from(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $this->string('from')->value()) ?: throw new \LogicException;
    }

    public function to(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $this->string('to')->value()) ?: throw new \LogicException;
    }
}
