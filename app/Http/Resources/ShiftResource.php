<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Формат совпадает с типом ShiftRecord на фронте (entities/shift/model/types.ts).
 *
 * @mixin Shift
 */
class ShiftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'employeeId' => $this->employee_id,
            'date' => $this->date,
            'start' => substr($this->start_time, 0, 5),
            'end' => substr($this->end_time, 0, 5),
            'templateId' => $this->shift_template_id,
            'status' => $this->status->value,
        ];
    }
}
