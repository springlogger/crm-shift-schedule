<?php

namespace Database\Factories;

use App\Enums\ShiftStatus;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shift>
 */
class ShiftFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'shift_template_id' => null,
            'date' => '2026-11-03',
            'start_time' => '07:00',
            'end_time' => '15:00',
            'status' => ShiftStatus::Draft,
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => ShiftStatus::Published]);
    }
}
