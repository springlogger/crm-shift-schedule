<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Формат совпадает с типом Employee на фронте (entities/employee/model/types.ts).
 *
 * @mixin Employee
 */
class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->first_name,
            'surname' => $this->last_name,
            'position' => $this->position,
            'hours' => $this->weekly_hours,
            'avatarUrl' => $this->avatar_url,
        ];
    }
}
