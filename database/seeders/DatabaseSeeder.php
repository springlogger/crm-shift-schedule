<?php

namespace Database\Seeders;

use App\Enums\ShiftColor;
use App\Enums\ShiftStatus;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $employees = collect([
            ['Кузнецова', 'Алина', '/avatar2.png'],
            ['Волков', 'Тимур', '/avatar3.png'],
            ['Морозова', 'Виктория', '/avatar1.png'],
            ['Соколов', 'Артём', null],
            ['Лебедева', 'Мария', null],
            ['Новиков', 'Денис', null],
            ['Фёдорова', 'Ксения', null],
            ['Егоров', 'Максим', null],
        ])->map(fn (array $row) => Employee::query()->create([
            'last_name' => $row[0],
            'first_name' => $row[1],
            'position' => 'агент',
            'weekly_hours' => 24,
            'avatar_url' => $row[2],
        ]));

        $templates = collect([
            ['Утро', '07:00', '15:00', ShiftColor::Lavanda],
            ['День', '10:00', '18:00', ShiftColor::Brand],
            ['Вечер', '15:00', '23:00', ShiftColor::Mint],
        ])->map(fn (array $row, int $i) => ShiftTemplate::query()->create([
            'name' => $row[0],
            'start_time' => $row[1],
            'end_time' => $row[2],
            'color' => $row[3],
            'sort' => $i,
        ]));

        // демо-график на текущую неделю: каждый работает три дня по 8 ч (= недельная норма),
        // воскресенье остаётся пустым, чтобы было видно «дырявое» покрытие
        $monday = CarbonImmutable::now()->startOfWeek();
        foreach ($employees as $i => $employee) {
            foreach ([$i % 6, ($i + 2) % 6, ($i + 4) % 6] as $k => $offset) {
                $template = $templates[($i + $k) % $templates->count()];

                Shift::query()->create([
                    'employee_id' => $employee->id,
                    'shift_template_id' => $template->id,
                    'date' => $monday->addDays($offset)->toDateString(),
                    'start_time' => $template->start_time,
                    'end_time' => $template->end_time,
                    'status' => ShiftStatus::Published,
                ]);
            }
        }
    }
}
