<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ShiftTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ShiftTemplate
 */
class ShiftTemplateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'start' => substr($this->start_time, 0, 5),
            'end' => substr($this->end_time, 0, 5),
            'color' => $this->color->value,
        ];
    }
}
