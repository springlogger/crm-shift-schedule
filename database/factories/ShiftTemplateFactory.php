<?php

namespace Database\Factories;

use App\Enums\ShiftColor;
use App\Models\ShiftTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShiftTemplate>
 */
class ShiftTemplateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Утро', 'День', 'Вечер', 'Ночь']),
            'start_time' => '09:00',
            'end_time' => '17:00',
            'color' => fake()->randomElement(ShiftColor::cases()),
            'sort' => 0,
        ];
    }
}
