<?php

namespace Tests\Feature;

use App\Enums\ShiftColor;
use App\Models\Employee;
use App\Models\ShiftTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_employees_are_listed_alphabetically(): void
    {
        Employee::factory()->create(['last_name' => 'Волков', 'first_name' => 'Тимур', 'avatar_url' => '/avatar3.png']);
        Employee::factory()->create(['last_name' => 'Кузнецова', 'first_name' => 'Алина']);

        $this->getJson('/api/employees')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.surname', 'Волков')
            ->assertJsonPath('data.0.name', 'Тимур')
            ->assertJsonPath('data.0.avatarUrl', '/avatar3.png')
            ->assertJsonPath('data.1.surname', 'Кузнецова');
    }

    public function test_employees_can_be_searched_by_several_words(): void
    {
        Employee::factory()->create(['last_name' => 'Kuznetsova', 'first_name' => 'Alina']);
        Employee::factory()->create(['last_name' => 'Volkov', 'first_name' => 'Timur']);

        $this->getJson('/api/employees?search='.urlencode('alin kuzn'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.surname', 'Kuznetsova');

        $this->getJson('/api/employees?search='.urlencode('volk alina'))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_employee_cache_is_invalidated_on_change(): void
    {
        Employee::factory()->create();
        $this->getJson('/api/employees')->assertJsonCount(1, 'data');

        Employee::factory()->create();
        $this->getJson('/api/employees')->assertJsonCount(2, 'data');
        // повторный запрос — из кэша
        $this->getJson('/api/employees')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_shift_templates_are_listed_in_order(): void
    {
        ShiftTemplate::factory()->create(['name' => 'Вечер', 'start_time' => '15:00', 'end_time' => '23:00', 'color' => ShiftColor::Mint, 'sort' => 2]);
        ShiftTemplate::factory()->create(['name' => 'Утро', 'start_time' => '07:00', 'end_time' => '15:00', 'color' => ShiftColor::Lavanda, 'sort' => 1]);

        $this->getJson('/api/shift-templates')
            ->assertOk()
            ->assertJsonPath('data.0', [
                'id' => ShiftTemplate::query()->where('name', 'Утро')->value('id'),
                'name' => 'Утро',
                'start' => '07:00',
                'end' => '15:00',
                'color' => 'lavanda',
            ])
            ->assertJsonPath('data.1.name', 'Вечер');

        // второй запрос идёт уже из кэша
        $this->getJson('/api/shift-templates')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Утро')
            ->assertJsonPath('data.0.color', 'lavanda');
    }
}
