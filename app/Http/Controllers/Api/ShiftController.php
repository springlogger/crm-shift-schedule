<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Http\Requests\SyncShiftsRequest;
use App\Http\Resources\ShiftResource;
use App\Services\ShiftSyncService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class ShiftController extends Controller
{
    public function __construct(private readonly ShiftSyncService $service) {}

    public function index(PeriodRequest $request): AnonymousResourceCollection
    {
        return ShiftResource::collection(
            $this->service->forPeriod($request->from()->toDateString(), $request->to()->toDateString()),
        );
    }

    /**
     * Полная замена смен периода. Фронт редактирует черновик локально
     * и по «Сохранить» присылает его целиком — сервер сам считает разницу.
     */
    public function sync(SyncShiftsRequest $request): AnonymousResourceCollection
    {
        return ShiftResource::collection(
            $this->service->sync($request->from(), $request->to(), $request->shifts()),
        );
    }

    public function publish(PeriodRequest $request): AnonymousResourceCollection
    {
        return ShiftResource::collection(
            $this->service->publish($request->from(), $request->to()),
        );
    }
}
