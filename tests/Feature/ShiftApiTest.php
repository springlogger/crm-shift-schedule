<?php

namespace Tests\Feature;

use App\Enums\ShiftStatus;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ShiftApiTest extends TestCase
{
    use RefreshDatabase;

    private const PERIOD = ['from' => '2026-11-02', 'to' => '2026-11-08'];

    /**
     * @param  list<array<string, mixed>>  $shifts
     */
    private function sync(array $shifts, array $period = self::PERIOD): TestResponse
    {
        return $this->putJson('/api/shifts/sync', [...$period, 'shifts' => $shifts]);
    }

    public function test_index_returns_only_shifts_inside_the_period(): void
    {
        $employee = Employee::factory()->create();
        Shift::factory()->for($employee)->create(['date' => '2026-11-01']);
        Shift::factory()->for($employee)->create(['date' => '2026-11-02', 'start_time' => '22:00', 'end_time' => '06:00']);
        Shift::factory()->for($employee)->create(['date' => '2026-11-08']);
        Shift::factory()->for($employee)->create(['date' => '2026-11-09']);

        $this->getJson('/api/shifts?'.http_build_query(self::PERIOD))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0', [
                'employeeId' => $employee->id,
                'date' => '2026-11-02',
                'start' => '22:00',
                'end' => '06:00',
                'templateId' => null,
                'status' => 'draft',
            ])
            ->assertJsonPath('data.1.date', '2026-11-08');
    }

    public function test_index_validates_the_period(): void
    {
        $this->getJson('/api/shifts?from=2026-11-08&to=2026-11-02')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');

        $this->getJson('/api/shifts?from=2026-01-01&to=2026-12-31')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');

        $this->getJson('/api/shifts?from=02.11.2026&to=2026-11-08')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('from');
    }

    public function test_sync_inserts_updates_and_deletes_only_inside_the_period(): void
    {
        $employee = Employee::factory()->create();
        $template = ShiftTemplate::factory()->create();
        $kept = Shift::factory()->for($employee)->create(['date' => '2026-11-03']);
        Shift::factory()->for($employee)->create(['date' => '2026-11-04']);
        $outside = Shift::factory()->for($employee)->create(['date' => '2026-11-20']);

        $this->sync([
            ['employee_id' => $employee->id, 'date' => '2026-11-03', 'start' => '10:00', 'end' => '18:00', 'template_id' => $template->id],
            ['employee_id' => $employee->id, 'date' => '2026-11-05', 'start' => '22:00', 'end' => '06:00', 'template_id' => null],
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.templateId', $template->id)
            ->assertJsonPath('data.1.start', '22:00');

        $this->assertSame(
            ['2026-11-03', '2026-11-05', '2026-11-20'],
            Shift::query()->orderBy('date')->pluck('date')->all(),
        );
        // смена обновилась на месте, а не пересоздалась
        $this->assertSame('10:00', substr($kept->fresh()?->start_time ?? '', 0, 5));
        $this->assertModelExists($outside);
    }

    public function test_sync_with_empty_list_clears_the_period(): void
    {
        Shift::factory()->create(['date' => '2026-11-03']);

        $this->sync([])->assertOk()->assertJsonCount(0, 'data');

        $this->assertDatabaseCount('shifts', 0);
    }

    public function test_sync_keeps_published_status_of_unchanged_shifts(): void
    {
        $employee = Employee::factory()->create();
        $unchanged = Shift::factory()->for($employee)->published()->create(['date' => '2026-11-03']);
        $changed = Shift::factory()->for($employee)->published()->create(['date' => '2026-11-04']);

        $this->sync([
            ['employee_id' => $employee->id, 'date' => '2026-11-03', 'start' => '07:00', 'end' => '15:00'],
            ['employee_id' => $employee->id, 'date' => '2026-11-04', 'start' => '08:00', 'end' => '15:00'],
        ])->assertOk();

        $this->assertSame(ShiftStatus::Published, $unchanged->fresh()?->status);
        $this->assertSame(ShiftStatus::Draft, $changed->fresh()?->status);
    }

    public function test_sync_rejects_invalid_shifts(): void
    {
        $employee = Employee::factory()->create();
        $valid = ['employee_id' => $employee->id, 'date' => '2026-11-03', 'start' => '07:00', 'end' => '15:00'];

        $this->sync([[...$valid, 'end' => '07:00']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts.0.end');

        $this->sync([[...$valid, 'date' => '2026-11-09']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts.0.date');

        $this->sync([[...$valid, 'start' => '7:00']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts.0.start');

        $this->sync([[...$valid, 'employee_id' => 999]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts');

        $this->sync([[...$valid, 'template_id' => 999]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts');

        $this->sync([$valid, [...$valid, 'start' => '10:00', 'end' => '18:00']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts');

        $this->putJson('/api/shifts/sync', self::PERIOD)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shifts');

        $this->assertDatabaseCount('shifts', 0);
    }

    public function test_publish_marks_period_shifts_as_published(): void
    {
        $employee = Employee::factory()->create();
        Shift::factory()->for($employee)->create(['date' => '2026-11-03']);
        Shift::factory()->for($employee)->create(['date' => '2026-11-07']);
        $outside = Shift::factory()->for($employee)->create(['date' => '2026-11-10']);

        $this->postJson('/api/shifts/publish', self::PERIOD)
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.status', 'published')
            ->assertJsonPath('data.1.status', 'published');

        $this->assertSame(ShiftStatus::Draft, $outside->fresh()?->status);
    }
}
