<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use Illuminate\Validation\Validator;

/**
 * @phpstan-import-type ShiftPayload from Shift
 */
class SyncShiftsRequest extends PeriodRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'shifts' => ['present', 'array'],
            // exists не ставим на каждый элемент: это отдельный SQL-запрос на смену,
            // а за месяц их сотни. Все id проверяются двумя whereIn в after()
            'shifts.*.employee_id' => ['required', 'integer'],
            'shifts.*.date' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:to'],
            'shifts.*.start' => ['required', 'date_format:H:i'],
            'shifts.*.end' => ['required', 'date_format:H:i', 'different:shifts.*.start'],
            'shifts.*.template_id' => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            ...parent::after(),
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $shifts = collect($this->shifts());

                $duplicate = $shifts
                    ->countBy(fn (array $s) => Shift::makeCellKey($s['employee_id'], $s['date']))
                    ->search(fn (int $count) => $count > 1);
                if ($duplicate !== false) {
                    $validator->errors()->add('shifts', 'У одного сотрудника не может быть двух смен в один день.');
                }

                $employeeIds = $shifts->pluck('employee_id')->unique();
                $missingEmployees = $employeeIds->diff(
                    Employee::query()->whereKey($employeeIds)->pluck('id'),
                );
                if ($missingEmployees->isNotEmpty()) {
                    $validator->errors()->add('shifts', 'Сотрудник не найден: '.$missingEmployees->implode(', ').'.');
                }

                $templateIds = $shifts->pluck('template_id')->filter()->unique();
                $missingTemplates = $templateIds->diff(
                    ShiftTemplate::query()->whereKey($templateIds)->pluck('id'),
                );
                if ($missingTemplates->isNotEmpty()) {
                    $validator->errors()->add('shifts', 'Шаблон смены не найден: '.$missingTemplates->implode(', ').'.');
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
            ...parent::messages(),
            'shifts.present' => 'Не передан список смен.',
            'shifts.*.date.after_or_equal' => 'Смена вне выбранного периода.',
            'shifts.*.date.before_or_equal' => 'Смена вне выбранного периода.',
            'shifts.*.start.date_format' => 'Время начала должно быть в формате ЧЧ:ММ.',
            'shifts.*.end.date_format' => 'Время конца должно быть в формате ЧЧ:ММ.',
            'shifts.*.end.different' => 'Начало и конец смены совпадают.',
        ];
    }

    /**
     * @return list<ShiftPayload>
     */
    public function shifts(): array
    {
        /** @var list<ShiftPayload> */
        return array_values($this->validated('shifts'));
    }
}
