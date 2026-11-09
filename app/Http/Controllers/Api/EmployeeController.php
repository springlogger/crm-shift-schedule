<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmployeeIndexRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class EmployeeController extends Controller
{
    public function index(EmployeeIndexRequest $request): AnonymousResourceCollection
    {
        $search = $request->search();

        // полный список отдаём из кэша; поиск идёт мимо кэша, его фронт обычно делает сам
        $employees = $search === ''
            ? Employee::cachedList()
            : Employee::query()->search($search)->orderBy('last_name')->orderBy('first_name')->get();

        return EmployeeResource::collection($employees);
    }
}
